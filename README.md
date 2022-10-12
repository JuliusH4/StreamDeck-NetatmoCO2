# StreamDeck-NetatmoCO2
Unofficial Plugin for an Elgato StreamDeck to display CO2-value form Netatmo weather stations.  

The value will be refreshed every 15 minutes or by pressing the key. (Pay attention, this just updates the value provided by Netatmo, which will not be refreshed every time)

>**This plugin is currently under development**  
Client ID, Client Secret and a refresh token have to be created manually (e.g. using [Postman](https://www.postman.com/)). Take a look at the [Netatmo documentation](https://dev.netatmo.com/apidocumentation/oauth) for further information. This process will be improved in future!

## Build
The plugin can be build with the official
[Distribution Tool](https://developer.elgato.com/documentation/stream-deck/sdk/packaging/) for Windows, which can be downloaded [here](https://developer.elgato.com/documentation/stream-deck/distributiontool/DistributionToolWindows.zip).  
To build the plugin, use the following command: `./DistributionTool.exe -b -i com.juliushenle.netatmo-co2.sdPlugin -o dist`.

## Open Features
- Support of multiple wether stations
- Easy creation of credentials (client_id, client_secret, refresh_token)
- Individual co2 thresholds
- Individual auto-refresh interval
