const Tsl2561 = require("../lib/index")

let sensor = new Tsl2561()

let fn = async () => {
    await sensor.init(1)

    let integrations = ['13.7ms','101ms','402ms','manual']

    let ids = await sensor.getId()
    let enabled = await sensor.isEnabled()
    let gain = await sensor.getGain()
    let integration = await sensor.getIntegrationTime()

    console.log(`Sensor TSL2561
 Part number : ${ids.partno}
 Revision number : ${ids.revno}
 Gain : ${gain == 0 ? '1x' : '16x'}
 Integration Time : ${integrations[integration]}
 Enabled : ${enabled ? 'yes' : 'no'}
`)

    if(!enabled)
        await sensor.enable()

    setInterval(async () => {

        let broadband = await sensor.getBroadband()
        let infrared = await sensor.getInfrared()
        let lux = await sensor.getLux()

        console.log(`Measure : Broadband ${broadband}, Infrared ${infrared}, Lux ${lux}`)

    },1000)
}

fn()