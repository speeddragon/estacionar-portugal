var config = {};
var notifications = {};

class API {
  constructor() {
    // Default values
    this.appId = 1;
    this.username = "";
    this.password = "";
    this.userSessionToken = "";
    this.accountToken = "";
  }

  setAppId(appId) {
    if (appId === 1 || appId === 2) {
      this.appId = appId;
    }
  }

  setCredentials(username, password) {
    this.username = username;
    this.password = password;
  }

  isLoggedIn() {
    return this.accountToken.length > 0 && this.userSessionToken.length > 0;
  }

  getBaseUrl() {
    return "https://eos.empark.com/api/v1.0";
  }

  getHeaders() {
    var headers = {};

    if (this.userSessionToken) {
      headers["X-EOS-USER-TOKEN"] = this.userSessionToken;
    }

    switch (this.appId) {
      case 1:
        // Via Verde
        headers["X-EOS-CLIENT-TOKEN"] = "2463bc87-6e92-480e-a56b-4260ff8b6a38";
        break;

      case 2:
        // Telpark
        headers["X-EOS-CLIENT-TOKEN"] = "4cc77160-4458-4f0d-a1f1-551d70daded0";
        break;
    }

    headers["Content-type"] = "application/json; charset=utf-8";
    headers["User-Agent"] =
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36";

    return headers;
  }

  login(successCallback) {
    console.log("API.login()");

    if (
      this.username !== undefined &&
      this.username.length > 0 &&
      this.password !== undefined &&
      this.password.length > 0
    ) {
      var data = {
        username: this.username,
        password: this.password
      };

      fetch(this.getBaseUrl() + "/auth/accounts/", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      })
        .then(response => {
          if (response.status == 200) {
            response.json().then(body => {
              // Setup login
              if (successCallback !== undefined) {
                successCallback(body);
              }
            });
          } else if (response.status == 401) {
            response.json().then(body => {
              if (
                body.message == "invalid token" &&
                body.type == "authenticationFailed"
              ) {
                api.accountToken = "";
                api.userSessionToken = "";

                // Try to login again
                login(successCallback);
              }
            });
          }
        })
        .catch(response => {
          console.log("LOGIN error!");
        });
    } else {
      console.log("No credentials found!");
    }
  }

  getSessions(type, successCallback, errorCallback) {
    console.log("API.getSessions(" + type + ")");
    if (this.isLoggedIn()) {
      fetch(
        this.getBaseUrl() +
          "/parking/sessions?account=" +
          api.accountToken +
          "&session_state=" +
          type,
        {
          headers: this.getHeaders()
        }
      )
        .then(response => {
          if (response.status == 200) {
            response.json().then(body => {
              // Setup login
              if (successCallback !== undefined) {
                successCallback(body);
              }
              console.log(body);
            });
          }
        })
        .catch(response => {
          console.log("Request error error!");
        });
    } else {
      if (errorCallback !== undefined) {
        console.log("Login missing!");
      }
    }
  }
}

var api = new API();

// Setup notification button actions
chrome.notifications.onButtonClicked.addListener(function(
  notificationKey,
  btnIdx
) {
  for (var key in notifications) {
    if (notifications.hasOwnProperty(key)) {
      if (notificationKey === key) {
        if (btnIdx === 0) {
          // TODO: Plus two hours
          console.log("Add two more hours!");
          alert("Não implementado!");
        } else if (btnIdx === 1) {
          // TODO: Until end of the day
          console.log("Until end of the day!");
          alert("Não implementado!");
        }
      }
    }
  }
});

// On Toolbar click, open options
chrome.browserAction.onClicked.addListener(function(activeTab) {
  chrome.tabs.create({
    url: "chrome-extension://" + chrome.runtime.id + "/index.html"
  });
});

// Sync options
chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (changes.config !== undefined) {
    config = changes.config.newValue;

    // Try to login again
    login();
  }

  if (changes.notifications !== undefined) {
    notifications = changes.notifications.newValue;
  }
});

/**
 * Create notification
 *
 * @param {object} session Session Object
 * @param {Date} end_date Ending Date
 * @param {integer} notify_ahead_seconds Number of seconds to be notified before the session expire
 */
function create_notification(session, end_date, notify_ahead_seconds) {
  var now = new Date();
  var session_id = session.token;
  var license_plate = session.plate.id;

  // Enable notification when expires in the future
  var diff_ms = (end_date.getTime() - now.getTime()) / 1000;

  if (diff_ms > 0) {
    var title =
      "A sua sessão expira em " +
      Math.round(notify_ahead_seconds / 60) +
      " minutos!";
    var message =
      "A sua sessão do veículo " + license_plate + " vai expirar brevemente!";
    if (notify_ahead_seconds == 0) {
      title = "A sua sessão expirou!";
      message = "A sua sessão do veículo " + license_plate + " expirou!";
    }

    if (diff_ms - notify_ahead_seconds > 0) {
      var key = session_id + "_" + notify_ahead_seconds;

      // Check if notifications was already set
      if (notifications[key] === undefined) {
        notifications[key] = {
          expire_date: end_date.getTime(),
          notify_ahead_seconds: notify_ahead_seconds,
          title: title,
          message: message
        };

        alarm_time = end_date.getTime() - notify_ahead_seconds * 1000;
        chrome.alarms.create(key, { when: alarm_time });
        alarm_time_date = new Date(alarm_time);

        console.log(
          "Create notification for Session ID [" +
            session_id +
            "] for " +
            alarm_time_date.toLocaleString()
        );
      }

      // Clean expired sessions
      for (var key in notifications) {
        if (notifications.hasOwnProperty(key)) {
          var real_notification_time =
            notifications[key].expire_date -
            notifications[key].notify_ahead_seconds;
          if (real_notification_time < now.getTime()) {
            delete notifications[key];
          }
        }
      }

      chrome.storage.sync.set({ notifications: notifications });
    }
  }
}

// onAlarm is better than setTimeout.
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (notifications[alarm.name] !== undefined) {
    chrome_notifications_object = {
      title: notifications[alarm.name].title,
      message: notifications[alarm.name].message,
      type: "basic",
      iconUrl: "icon_128.png",
      requireInteraction: false,
      buttons: [{ title: "Mais 2 horas!" }, { title: "Até fim do dia!" }]
    };

    // Only when it expires, it keep always on top until user close it.
    if (notifications[alarm.name].notify_ahead_seconds == 0) {
      chrome_notifications_object.requireInteraction = true;
    }

    chrome.notifications.create(alarm.name, chrome_notifications_object);
  }
});

// Login and check active sessions
function login() {
  api.setAppId(config.app_id);
  api.setCredentials(config.username, config.password);

  // Login and get active sessions
  api.login(function() {
    // With success

    // Get active sessions
    api.getSessions("ACTIVE", function(response) {
      for (var i = 0; i < response.length; i++) {
        var start_date = new Date(response[i].dtstart.date);
        var end_date = new Date(
          start_date.getTime() + response[i].cost_time_pair.duration_ms
        );

        create_notification(response[i], end_date, 0);
        create_notification(response[i], end_date, 5 * 60); // 5m before
      }
    });
  });
}

function check_active_sessions() {
  // Get active sessions
  api.getSessions("ACTIVE", function(response) {
    console.log("Active sessions: " + response.length);
    for (var i = 0; i < response.length; i++) {
      var start_date = new Date(response[i].dtstart.date);
      var end_date = new Date(
        start_date.getTime() +
          response[i].cost_time_pair.duration_ms * 60 * 1000
      );

      create_notification(response[i], end_date, 0);
      create_notification(response[i], end_date, 5 * 60);
    }
  });

  setTimeout(check_active_sessions, 5 * 60 * 1000);
}

//
// Start
//

chrome.storage.sync.get(["config", "notifications"], function(items) {
  // Check if credentials are set
  if (items.config !== undefined) {
    // Copy config
    config = items.config;

    api.userSessionToken = items.config.user_session_token;
    api.accountToken = items.config.account_token;

    if (
      items.config.username !== undefined &&
      items.config.password !== undefined
    ) {
      login();
    }
  }

  if (items.notifications !== undefined) {
    notifications = items.notifications;
  }

  // Check active sessions every 5 minutes
  setTimeout(check_active_sessions, 5 * 60 * 1000);
});
