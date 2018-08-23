# TSL2561

Binding of the [Adafruit TSL2561 script](https://github.com/adafruit/Adafruit_CircuitPython_TSL2561) for the light sensor

TSL3561 is a digital light sensor sold by [Adafruit](https://www.adafruit.com/product/439).
This module is a binding of the script published by Adafruit in Python in Javascript.

## Installation

Just install the npm package

```
npm install ada-tsl2561
```

## Usage

The module contains the class `Tsl2561` and all the asynchroneous methods are native promise based

```javascript
const Tsl2561 = require("../lib/index")

let sensor = new Tsl2561()

await sensor.init(1)

let enabled = await sensor.isEnabled()
if(!enabled)
    await sensor.enable()

let broadband = await sensor.getBroadband()
let infrared = await sensor.getInfrared()
let lux = await sensor.getLux()

console.log(`Measure : Broadband ${broadband}, Infrared ${infrared}, Lux ${lux}`)
```

### API

#### Tsl2561 Class

The main class of the module representing a sensor

##### init(busNumber,[address])

Initialize the i2c bus and set the sensor address

* busNumber : The i2c bus number to use
* address : The address of the sensor (default 0x39)

##### free()

Free the i2c bus

##### enable()

Enable the sensor

All measures of the sensor are at 0 is not enabled

##### disable()

Disable the sensor

All measures will be at 0 after disabling the sensor

##### isEnabled()

Check if the sensor is enabled returning `true` if the sensor is enabled

##### getLux()

Get the lux measure of the sensor

##### getId()

Read the part number and the revision number of the sensor

This method return an objecto containing the part number (as `partno`) and the revision number (as `revno`)

##### getBroadband()

Get the broadband channel measure

##### getInfrared()

Get the infrared channel measure

##### getGain()

Get the current gain of the sensor

* 0 : 1x
* 1 : 16x

##### setGain(newGain)

Set the gain of the sensor

* 0 : 1x
* 1 : 16x

##### getIntegrationTime()

Get the current integration time of the sensor

*  0 : 13.7ms
*  1 : 101ms
*  2 : 402ms
*  3 : manual

##### setIntegrationTime(newIntegrationTime)

Set the integration time of the sensor

*  0 : 13.7ms
*  1 : 101ms
*  2 : 402ms
*  3 : manual