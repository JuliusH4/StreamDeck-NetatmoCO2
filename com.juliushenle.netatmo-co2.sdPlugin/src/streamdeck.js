/* global $CC, Utils, $SD */

/**
 * Here are a couple of wrappers we created to help you quickly setup
 * your plugin and subscribe to events sent by Stream Deck to your plugin.
 */

/**
 * The 'connected' event is sent to your plugin, after the plugin's instance
 * is registered with Stream Deck software. It carries the current websocket
 * and other information about the current environmet in a JSON object
 * You can use it to subscribe to events you want to use in your plugin.
 */

$SD.on("connected", (jsonObj) => connected(jsonObj));

let refresh_token = "xx";
let access_token = "xx";
const client_id = "xx";
const client_secret = "xx";

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
  $SD.on(
    "com.juliushenle.netatmo-co2.displayco2.propertyInspectorDidAppear",
    (jsonObj) => {
      console.log(
        "%c%s",
        "color: white; background: black; font-size: 13px;",
        "[app.js]propertyInspectorDidAppear:"
      );
    }
  );
  $SD.on(
    "com.juliushenle.netatmo-co2.displayco2.propertyInspectorDidDisappear",
    (jsonObj) => {
      console.log(
        "%c%s",
        "color: white; background: red; font-size: 13px;",
        "[app.js]propertyInspectorDidDisappear:"
      );
    }
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
  },

  /**
   * The 'willAppear' event is the first event a key will receive, right before it gets
   * shown on your Stream Deck and/or in Stream Deck software.
   * This event is a good place to setup your plugin and look at current settings (if any),
   * which are embedded in the events payload.
   */

  onWillAppear: function (jsn) {
    /**
     * The willAppear event carries your saved settings (if any). You can use these settings
     * to setup your plugin or save the settings for later use.
     * If you want to request settings at a later time, you can do so using the
     * 'getSettings' event, which will tell Stream Deck to send your data
     * (in the 'didReceiveSettings above)
     *
     */
  },

  onKeyUp: function (jsn) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${access_token}`);

    const requestOptions = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    fetch("https://api.netatmo.com/api/getstationsdata", requestOptions)
      .then((response) => {
        resultStatus = response.status;
        return response.json();
      })
      .then((result) => {
        console.log(result);
        switch (resultStatus) {
          case 200:
            const co2_value = result.body.devices[0].dashboard_data.CO2;
            console.log("CO2 Value", co2_value);
            $SD.api.setTitle(jsn.context, co2_value);
            console.log("title set");

            const imagePath =
              co2_value < 1000
                ? "images/assets/key_green.png"
                : co2_value > 2000
                ? "images/assets/key_orange.png"
                : "images/assets/key_red.png";
            console.log("LoadImage:", imagePath);
            this.setImage(jsn, imagePath);
            console.log("Image succesful updated");
            break;
          case 403:
            if (result.error.code != undefined && result.error.code == 3) {
              console.log("Refresh");
              break;
            }
          default:
            console.error("unknown response", resultStatus, result);
        }
      })
      .catch((error) => console.log("error", error));
  },

  onSendToPlugin: function (jsn) {
    /**
     * This is a message sent directly from the Property Inspector
     * (e.g. some value, which is not saved to settings)
     * You can send this event from Property Inspector (see there for an example)
     */

    const sdpi_collection = Utils.getProp(jsn, "payload.sdpi_collection", {});
  },

  /**
   * This snippet shows how you could save settings persistantly to Stream Deck software.
   * It is not used in this example plugin.
   */

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

  /**
   * Here's a quick demo-wrapper to show how you could change a key's title based on what you
   * stored in settings.
   * If you enter something into Property Inspector's name field (in this demo),
   * it will get the title of your key.
   *
   * @param {JSON} jsn // The JSON object passed from Stream Deck to the plugin, which contains the plugin's context
   *
   */
};

const newToken = () => {
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
        access_token = result.access_token;
      }
      console.error("unknown resopnse while refresh", result);
    })
    .catch((error) => console.log("error", error));
};

function loadImageAsDataUri(url, callback) {
  var image = new Image();

  image.onload = function () {
    var canvas = document.createElement("canvas");

    canvas.width = this.naturalWidth;
    canvas.height = this.naturalHeight;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0);
    callback(canvas.toDataURL("image/png"));
  };

  image.src = url;
}
