// Import SmartApp sdk.
const { default: axios } = require('@smartthings/core-sdk/node_modules/axios');
const SmartApp = require('@smartthings/smartapp');

// Use express for the Node.js webserver.
const express = require('express');
const server = express();
const PORT = 3000;
let DEVICE_ID = ""
let LOCATION_ID = ""



// A function to send random on and off commands to the light.
async function randomSwitch(context, updateData) {
  // Get a random 1 or 0 and assign on or off based on the result.
  const randomSwitch = Math.round(Math.random()) == 1 ? 'on' : 'off';
  console.log("----------------------------");
  console.log(DEVICE_ID, LOCATION_ID)
  try {
    const deviceId = updateData.installedApp.config.lightSwitch[0].deviceConfig.deviceId
    const locationId = updateData.installedApp.locationId
    DEVICE_ID = deviceId
    LOCATION_ID = locationId
  }
  catch {
    console.log("Timer event");
  }
  finally{
    
    try{
      const response = await axios(`http://localhost:5000/?deviceId=${DEVICE_ID}&locationId=${LOCATION_ID}`);
      await context.api.devices.sendCommands(context.config.lightSwitch, [
        {
          capability: 'switch',
          command: randomSwitch
        }
      ]);
    }
    catch{
      console.log("Unauthorized");
    }
  }
}

// Define the SmartApp.
const smartapp = new SmartApp()
  // Enable translations.
  // Update translation file on changes.
  .configureI18n({updateFiles: true})

  // Logging for testing.
  .enableEventLogging(2)

  .page('mainPage', (context, page, configData) => {
    // Define SmartApp page sections.
    // These are the sections for user input.
    page.section('checkDuration', section => {
      section
        .enumSetting('lightCheckDuration')
        .options([
          { id: '1', name: '1 Minute' },
          { id: '2', name: '2 Minutes' },
          { id: '5', name: '5 Minutes' }
        ])
        .defaultValue('1');
    });
    page.section('lightSwitch', section => {
      section
        .deviceSetting('lightSwitch')
        .capabilities(['switch'])
        .permissions('rx')
        .required(true);
    });
  })

  .updated(async (context, updateData) => {
    // Use this section during the install and update lifecycles.

    // Clear any existing configuration.
    await context.api.schedules.delete()

    // Set initial switch toggle.
    await randomSwitch(context, updateData);
    
    // Schedule future toggle checks.
    await context.api.schedules.schedule(
      'lightScheduleHandler', 
      `0/${context.configStringValue('lightCheckDuration')} * * * ? *`, 
      'UTC'
    );
  })

  .subscribedEventHandler('myDeviceEventHandler', async (context, event) => {
    // Subscribe to a device event such as a switch turning on or off.
    // Not using for this implementation.
  })

  .scheduledEventHandler('lightScheduleHandler', async (context, event) => {
    // Every duration chosen by user, toggle the light switch.
    randomSwitch(context, event); // randomSwitch(context) - original
  });

// Define webserver for receiving communication.
server.use(express.json());

// Handle POST requests.
server.post('/', function (req, res, next) {
    smartapp.handleHttpCallback(req, res);
  // handleHttpCallback is a function in the SmartThings SDK.
});

server.listen(PORT, () => {
  console.log(`App is listening at http://localhost:${PORT}`)
})