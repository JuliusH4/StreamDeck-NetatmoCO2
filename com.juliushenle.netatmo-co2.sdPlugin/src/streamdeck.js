/* global $CC, Utils, $SD */

$SD.on("connected", (jsonObj) => connected(jsonObj));

let access_token = null;

function connected(jsn) {
  // Subscribe to the willAppear and other events
  console.log("Streamdeck Connected");

  $SD.on("com.juliushenle.netatmo-co2.displayco2.willAppear", (jsonObj) =>
    action.onWillAppear(jsonObj)
  );
  $SD.on("com.juliushenle.netatmo-co2.displayco2.keyUp", (jsonObj) =>
    action.onKeyUp(jsonObj)
  );
  $SD.on("com.juliushenle.netatmo-co2.displayco2.sendToPlugin", (jsonObj) =>
    action.onSendToPlugin(jsonObj)
  );
  $SD.on(
    "com.juliushenle.netatmo-co2.displayco2.didReceiveSettings",
    (jsonObj) => action.onDidReceiveSettings(jsonObj)
  );
}

// ACTIONS

const action = {
  settings: {},
  onDidReceiveSettings: function (jsn) {
    /**
     * If you enter some data into that
     * input-field it get's saved to Stream Deck persistently and the plugin
     * will receive the updated 'didReceiveSettings' event.
     */
    this.settings = Utils.getProp(jsn, "payload.settings", {});
  },

  /**
   * The 'willAppear' event is the first event a key will receive, right before it gets
   * shown on your Stream Deck and/or in Stream Deck software.
   */

  onWillAppear: function (jsn) {
    this.settings = jsn.payload.settings;

    setInterval(() => {
      console.info("Auto update");
      this.updateKey(jsn);
    }, 15 * 60 * 1000); // every 15 minutes
  },

  onKeyUp: function (jsn) {
    this.updateKey(jsn);
  },

  onSendToPlugin: function (jsn) {
    /**
     * This is a message sent directly from the Property Inspector
     */

    const sdpi_collection = Utils.getProp(jsn, "payload.sdpi_collection", {});

    if (sdpi_collection.key === "btnReset") {
      console.log("reset access token");
      access_token = null;
    }
  },

  setImage: function (jsn, image) {
    loadImageAsDataUri(image, (imgUrl) => {
      $SD.api.setImage(
        jsn.context,
        imgUrl,
        DestinationEnum.HARDWARE_AND_SOFTWARE
      );
    });
  },

  saveSettings: function (jsn, sdpi_collection) {
    console.log("saveSettings:", jsn);
    if (sdpi_collection.hasOwnProperty("key") && sdpi_collection.key != "") {
      if (sdpi_collection.value && sdpi_collection.value !== undefined) {
        this.settings[sdpi_collection.key] = sdpi_collection.value;
        console.log("setSettings....", this.settings);
        $SD.api.setSettings(jsn.context, this.settings);
      }
    }
  },

  updateKey: function (jsn) {
    console.log("run try");
    this.getco2value().catch((error) => {
      console.log("run catch", this.settings.refresh_token);
      if (this.settings.refresh_token != null) {
        newToken(
          this.settings.client_id,
          this.settings.client_secret,
          this.settings.refresh_token
        );
        this.getco2value(jsn);
      }
    });
  },

  getco2value: async function (jsn) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${access_token}`);

    const requestOptions = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    await fetch("https://api.netatmo.com/api/getstationsdata", requestOptions)
      .then((response) => {
        resultStatus = response.status;
        return response.json();
      })
      .then((result) => {
        console.info("Response getStationsData", result);
        switch (resultStatus) {
          case 200:
            co2_value = result.body.devices[0].dashboard_data.CO2;
            console.log("set Title", co2_value);
            $SD.api.setTitle(jsn.context, co2_value);
            const imagePath =
              co2_value < 1000
                ? "images/assets/key_green.png"
                : co2_value < 2000
                ? "images/assets/key_orange.png"
                : "images/assets/key_red.png";
            this.setImage(jsn, imagePath);
            break;
          case 403:
            const isError = result.error != undefined;
            if (isError && result.error.code == 3) {
              console.info("Refresh required");
              throw "Refresh required";
            }
            if (isError && result.error.code == 2) {
              console.info("Invalid access token");
              throw "New access token required";
            }
          default:
            console.error("unknown response", resultStatus, result);
        }
      });
  },
};

const newToken = (client_id, client_secret, refresh_token) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "refresh_token");
  urlencoded.append("refresh_token", refresh_token);
  urlencoded.append("client_id", client_id);
  urlencoded.append("client_secret", client_secret);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };
  fetch("https://api.netatmo.com/oauth2/token", requestOptions)
    .then((response) => {
      isresultOk = response.ok;
      return response.json();
    })
    .then((result) => {
      if (isresultOk) {
        console.info("Set new access token", access_token);
        access_token = result.access_token;
      } else {
        console.error("unknown resopnse while refresh", result);
      }
    })
    .catch((error) => console.log("error", error));
};

function loadImageAsDataUri(url, callback) {
  let image = new Image();

  image.onload = function () {
    let canvas = document.createElement("canvas");

    canvas.width = this.naturalWidth;
    canvas.height = this.naturalHeight;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0);
    callback(canvas.toDataURL("image/png"));
  };

  image.src = url;
}
