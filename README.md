# StreamDeck-NetatmoCO2
Unofficial Plugin for an Elgato StreamDeck plugin to display CO2-value form Netatmo weather station.

>This plugin is currently under development.
Client ID, Client Secret and a refresh token heve to be created manualy (e.g. using [Postman](https://www.postman.com/)). Take a look at the [Netatmo documantaion](https://dev.netatmo.com/apidocumentation/oauth) for further information. This process will be improved in future!

## Build
[Distribution Tool](https://developer.elgato.com/documentation/stream-deck/sdk/packaging/) for Windows can be downloaded [here](https://developer.elgato.com/documentation/stream-deck/distributiontool/DistributionToolWindows.zip).  
To build the plugin, use the following comand `./DistributionTool.exe -b -i com.juliushenle.netatmo-co2.sdPlugin -o dist`.

## Open Features
- Support of multiple wether stations
- Easy creation of credentials (client_id, client_secret, refresh_token)
- Individual co2 thresholds
- Individual auto-refresh intervall