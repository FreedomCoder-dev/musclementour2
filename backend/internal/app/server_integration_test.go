package app_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/musclementour/app/internal/app"
	"github.com/musclementour/app/internal/config"
)

type testServer struct {
	t          *testing.T
	server     *app.Server
	httpServer *httptest.Server
	client     *http.Client
}

func newTestServer(t *testing.T) *testServer {
	t.Helper()

	cfg := &config.Config{
		ServerPort:         0,
		DatabaseURL:        "",
		AccessTokenSecret:  "test-access-secret",
		RefreshTokenSecret: "test-refresh-secret",
		AccessTokenTTL:     time.Minute,
		RefreshTokenTTL:    time.Hour,
		AdminEmail:         "admin@test.app",
		AdminPassword:      "AdminPass123!",
	}

	repo := newMemoryRepository()
	srv, err := app.NewServerWithRepository(cfg, repo)
	require.NoError(t, err)

	httpSrv := httptest.NewServer(srv.Router())

	t.Cleanup(func() {
		httpSrv.Close()
		require.NoError(t, srv.Shutdown(nil))
	})

	return &testServer{
		t:          t,
		server:     srv,
		httpServer: httpSrv,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (ts *testServer) doRequest(method, path string, body []byte, token string) ([]byte, *http.Response) {
	ts.t.Helper()

	req, err := http.NewRequest(method, ts.httpServer.URL+path, bytes.NewReader(body))
	require.NoError(ts.t, err)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := ts.client.Do(req)
	require.NoError(ts.t, err)

	data, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	require.NoError(ts.t, err)

	return data, resp
}

func readTestData(t *testing.T, relativePath string) []byte {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)

	base := filepath.Join(filepath.Dir(filename), "..", "..", "testdata", relativePath)
	data, err := os.ReadFile(base)
	require.NoError(t, err)
	return data
}

type authResponse struct {
	User struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Role  string `json:"role"`
	} `json:"user"`
	Tokens struct {
		AccessToken  string `json:"accessToken"`
		RefreshToken string `json:"refreshToken"`
		ExpiresIn    int64  `json:"expiresIn"`
	} `json:"tokens"`
}

func (ts *testServer) login(email, password string) authResponse {
	ts.t.Helper()

	payload := map[string]string{
		"email":    email,
		"password": password,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.t, err)

	data, resp := ts.doRequest(http.MethodPost, "/api/v1/auth/login", body, "")
	require.Equal(ts.t, http.StatusOK, resp.StatusCode)

	var auth authResponse
	require.NoError(ts.t, json.Unmarshal(data, &auth))
	return auth
}

func TestAuthFlow(t *testing.T) {
	ts := newTestServer(t)

	t.Run("register, login, refresh and logout user", func(t *testing.T) {
		// Arrange
		registerPayload := readTestData(t, filepath.Join("auth", "register_user.json"))

		// Act
		data, resp := ts.doRequest(http.MethodPost, "/api/v1/auth/register", registerPayload, "")

		// Assert
		require.Equal(t, http.StatusCreated, resp.StatusCode)
		var register authResponse
		require.NoError(t, json.Unmarshal(data, &register))
		require.NotEmpty(t, register.User.ID)
		require.Equal(t, "athlete@example.com", register.User.Email)
		require.NotEmpty(t, register.Tokens.AccessToken)
		require.NotEmpty(t, register.Tokens.RefreshToken)

		// Act
		loginPayload := readTestData(t, filepath.Join("auth", "login_user.json"))
		loginData, loginResp := ts.doRequest(http.MethodPost, "/api/v1/auth/login", loginPayload, "")

		// Assert
		require.Equal(t, http.StatusOK, loginResp.StatusCode)
		var login authResponse
		require.NoError(t, json.Unmarshal(loginData, &login))
		require.Equal(t, register.User.ID, login.User.ID)
		require.NotEmpty(t, login.Tokens.AccessToken)

		// Arrange
		token := login.Tokens.AccessToken
		refreshBody, err := json.Marshal(map[string]string{"refreshToken": login.Tokens.RefreshToken})
		require.NoError(t, err)

		// Act
		_, unauthorizedResp := ts.doRequest(http.MethodGet, "/api/v1/profile", nil, "")
		profileData, profileResp := ts.doRequest(http.MethodGet, "/api/v1/profile", nil, token)

		// Assert
		require.Equal(t, http.StatusUnauthorized, unauthorizedResp.StatusCode)
		require.Equal(t, http.StatusOK, profileResp.StatusCode)
		var profile struct {
			ID    string `json:"id"`
			Email string `json:"email"`
			Role  string `json:"role"`
		}
		require.NoError(t, json.Unmarshal(profileData, &profile))
		require.Equal(t, register.User.ID, profile.ID)
		require.Equal(t, "athlete@example.com", profile.Email)
		require.Equal(t, "user", profile.Role)

		// Act
		refreshData, refreshResp := ts.doRequest(http.MethodPost, "/api/v1/auth/refresh", refreshBody, "")

		// Assert
		require.Equal(t, http.StatusOK, refreshResp.StatusCode)
		var refresh struct {
			Tokens struct {
				AccessToken  string `json:"accessToken"`
				RefreshToken string `json:"refreshToken"`
				ExpiresIn    int64  `json:"expiresIn"`
			} `json:"tokens"`
			User struct {
				ID    string `json:"id"`
				Email string `json:"email"`
				Role  string `json:"role"`
			} `json:"user"`
		}
		require.NoError(t, json.Unmarshal(refreshData, &refresh))
		require.Equal(t, register.User.ID, refresh.User.ID)
		require.NotEmpty(t, refresh.Tokens.AccessToken)
		require.NotEmpty(t, refresh.Tokens.RefreshToken)

		// Act
		refreshedProfileData, refreshedProfileResp := ts.doRequest(http.MethodGet, "/api/v1/profile", nil, refresh.Tokens.AccessToken)

		// Assert
		require.Equal(t, http.StatusOK, refreshedProfileResp.StatusCode)
		var refreshedProfile struct {
			ID string `json:"id"`
		}
		require.NoError(t, json.Unmarshal(refreshedProfileData, &refreshedProfile))
		require.Equal(t, register.User.ID, refreshedProfile.ID)

		// Act
		reuseRefreshData, reuseRefreshResp := ts.doRequest(http.MethodPost, "/api/v1/auth/refresh", refreshBody, "")

		// Assert
		require.Equal(t, http.StatusUnauthorized, reuseRefreshResp.StatusCode)
		var reuseError struct {
			Error string `json:"error"`
		}
		require.NoError(t, json.Unmarshal(reuseRefreshData, &reuseError))
		require.Equal(t, "refresh token not found", reuseError.Error)

		// Act
		logoutBody, err := json.Marshal(map[string]string{"refreshToken": refresh.Tokens.RefreshToken})
		require.NoError(t, err)
		logoutData, logoutResp := ts.doRequest(http.MethodPost, "/api/v1/auth/logout", logoutBody, "")

		// Assert
		require.Equal(t, http.StatusNoContent, logoutResp.StatusCode)
		require.Empty(t, logoutData)

		// Act
		postLogoutRefreshData, postLogoutRefreshResp := ts.doRequest(http.MethodPost, "/api/v1/auth/refresh", logoutBody, "")

		// Assert
		require.Equal(t, http.StatusUnauthorized, postLogoutRefreshResp.StatusCode)
		var postLogoutError struct {
			Error string `json:"error"`
		}
		require.NoError(t, json.Unmarshal(postLogoutRefreshData, &postLogoutError))
		require.Equal(t, "refresh token not found", postLogoutError.Error)
	})
}

func TestAdminExerciseLifecycle(t *testing.T) {
	ts := newTestServer(t)

	// Arrange
	admin := ts.login("admin@test.app", "AdminPass123!")
	initialListData, initialListResp := ts.doRequest(http.MethodGet, "/api/v1/exercises", nil, "")
	require.Equal(t, http.StatusOK, initialListResp.StatusCode)
	var initialList []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	require.NoError(t, json.Unmarshal(initialListData, &initialList))
	createPayload := readTestData(t, filepath.Join("exercises", "create.json"))

	// Act
	createData, createResp := ts.doRequest(http.MethodPost, "/api/v1/exercises", createPayload, admin.Tokens.AccessToken)

	// Assert
	require.Equal(t, http.StatusCreated, createResp.StatusCode)
	var created struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		MuscleGroup string `json:"muscleGroup"`
		Equipment   string `json:"equipment"`
	}
	require.NoError(t, json.Unmarshal(createData, &created))
	require.NotEmpty(t, created.ID)
	require.Equal(t, "Back Squat", created.Name)

	// Arrange
	updatePayloadTemplate := readTestData(t, filepath.Join("exercises", "update.json"))
	var updateInput map[string]interface{}
	require.NoError(t, json.Unmarshal(updatePayloadTemplate, &updateInput))
	updateInput["id"] = created.ID
	updateBody, err := json.Marshal(updateInput)
	require.NoError(t, err)

	// Act
	updateData, updateResp := ts.doRequest(http.MethodPut, "/api/v1/exercises/"+created.ID, updateBody, admin.Tokens.AccessToken)

	// Assert
	require.Equal(t, http.StatusOK, updateResp.StatusCode)
	var updated struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		MuscleGroup string `json:"muscleGroup"`
		Equipment   string `json:"equipment"`
	}
	require.NoError(t, json.Unmarshal(updateData, &updated))
	require.Equal(t, created.ID, updated.ID)
	require.Equal(t, "Front Squat", updated.Name)

	// Act
	listData, listResp := ts.doRequest(http.MethodGet, "/api/v1/exercises", nil, "")

	// Assert
	require.Equal(t, http.StatusOK, listResp.StatusCode)
	var list []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	require.NoError(t, json.Unmarshal(listData, &list))
	require.GreaterOrEqual(t, len(list), len(initialList)+1)
	found := false
	for _, item := range list {
		if item.ID == updated.ID {
			found = true
			break
		}
	}
	require.True(t, found)

	// Act
	_, deleteResp := ts.doRequest(http.MethodDelete, "/api/v1/exercises/"+created.ID, nil, admin.Tokens.AccessToken)

	// Assert
	require.Equal(t, http.StatusNoContent, deleteResp.StatusCode)
	listAfterDelete, listAfterResp := ts.doRequest(http.MethodGet, "/api/v1/exercises", nil, "")
	require.Equal(t, http.StatusOK, listAfterResp.StatusCode)
	var remaining []struct {
		ID string `json:"id"`
	}
	require.NoError(t, json.Unmarshal(listAfterDelete, &remaining))
	for _, item := range remaining {
		require.NotEqual(t, created.ID, item.ID)
	}
}

func TestWorkoutLifecycle(t *testing.T) {
	ts := newTestServer(t)

	// Arrange
	admin := ts.login("admin@test.app", "AdminPass123!")
	createExercisePayload := readTestData(t, filepath.Join("exercises", "create.json"))
	exerciseData, createResp := ts.doRequest(http.MethodPost, "/api/v1/exercises", createExercisePayload, admin.Tokens.AccessToken)
	require.Equal(t, http.StatusCreated, createResp.StatusCode)
	var exercise struct {
		ID string `json:"id"`
	}
	require.NoError(t, json.Unmarshal(exerciseData, &exercise))

	registerPayload := readTestData(t, filepath.Join("auth", "register_user.json"))
	_, registerResp := ts.doRequest(http.MethodPost, "/api/v1/auth/register", registerPayload, "")
	require.Equal(t, http.StatusCreated, registerResp.StatusCode)
	user := ts.login("athlete@example.com", "TrainHard123!")

	workoutTemplate := readTestData(t, filepath.Join("workouts", "session.json"))
	var workout map[string]interface{}
	require.NoError(t, json.Unmarshal(workoutTemplate, &workout))
	entries, ok := workout["entries"].([]interface{})
	require.True(t, ok)
	entry, ok := entries[0].(map[string]interface{})
	require.True(t, ok)
	entry["exerciseId"] = exercise.ID
	workoutBody, err := json.Marshal(workout)
	require.NoError(t, err)

	// Act
	workoutData, workoutResp := ts.doRequest(http.MethodPost, "/api/v1/workouts", workoutBody, user.Tokens.AccessToken)

	// Assert
	require.Equal(t, http.StatusCreated, workoutResp.StatusCode)
	var created struct {
		ID      string `json:"id"`
		Entries []struct {
			ExerciseID string `json:"exerciseId"`
		} `json:"entries"`
	}
	require.NoError(t, json.Unmarshal(workoutData, &created))
	require.NotEmpty(t, created.ID)
	require.Len(t, created.Entries, 1)
	require.Equal(t, exercise.ID, created.Entries[0].ExerciseID)

	// Act
	listData, listResp := ts.doRequest(http.MethodGet, "/api/v1/workouts", nil, user.Tokens.AccessToken)

	// Assert
	require.Equal(t, http.StatusOK, listResp.StatusCode)
	var sessions []struct {
		ID      string `json:"id"`
		Entries []struct {
			ExerciseID string `json:"exerciseId"`
		} `json:"entries"`
	}
	require.NoError(t, json.Unmarshal(listData, &sessions))
	require.Len(t, sessions, 1)
	require.Equal(t, created.ID, sessions[0].ID)
	require.Len(t, sessions[0].Entries, 1)
	require.Equal(t, exercise.ID, sessions[0].Entries[0].ExerciseID)

	// Act
	_, unauthorizedResp := ts.doRequest(http.MethodPost, "/api/v1/workouts", workoutBody, "")

	// Assert
	require.Equal(t, http.StatusUnauthorized, unauthorizedResp.StatusCode)
}
