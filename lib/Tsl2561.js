const i2c = require("i2c-bus")
const Buffer = require("buffer").Buffer

const DEFAULT_ADDRESS = 0x39
const COMMAND_BIT = 0x80
const WORD_BIT = 0x20

const CONTROLS = {
    POWERON: 0x03,
    POWEROFF: 0x00
}

const REGISTERS = {
    CONTROL: 0x00,
    TIMING: 0x01,
    CHAN0_LOW: 0x0C,
    CHAN1_LOW: 0x0E,
    ID: 0x0A
}

const SCALES = {
    GAIN: [16, 1],
    TIME: [1 / 0.034, 1 / 0.252, 1]
}

const CLIP_THRESHOLD = [4900, 37000, 65000]

class Tsl2561 {

    constructor() {

        this.i2c = null

    }

    /**
     * Initalize the i2c bus and define the address of the device to communicate with
     * @param busNumber The i2c bus number
     * @param deviceAddress The address of the device
     * @returns {Promise<Tsl2561>}
     */
    init(busNumber, deviceAddress = DEFAULT_ADDRESS) {

        this.address = deviceAddress

        return new Promise((resolve, reject) => {
            let openedI2c = i2c.open(busNumber, (err) => {
                if (err)
                    return reject(err)
                this.i2c = openedI2c
                resolve(this)
            })
        })
    }

    /**
     * Free the i2c bus
     * @return {Promise<Tsl2561>}
     */
    free() {
        this.$checkInit()
        return new Promise((resolve, reject) => {
            this.i2c.close((err) => {
                if (err)
                    return reject(err)
                this.i2c = null
                return resolve(this)
            })
        })
    }

    /**
     * Enable the sensor
     * All measures are at 0 of the sensor is not enabled
     * @return {Promise<Tsl2561>}
     */
    async enable() {
        this.$checkInit()
        await this.$writeControlRegister(CONTROLS.POWERON)
        return this
    }

    /**
     * Disable the sensor
     * All measures will be at 0 after disabling the sensor
     * @return {Promise<Tsl2561>}
     */
    async disable() {
        this.$checkInit()
        await this.$writeControlRegister(CONTROLS.POWEROFF)
        return this
    }

    /**
     * Read the part number and the revision number of the sensor
     * @return {Promise<{partno: number, revno: number}>}
     */
    async getId() {
        this.$checkInit()
        let idVal = (await this.$readRegister(REGISTERS.ID))[0]
        let values = {
            partno: (idVal >> 4) & 0x0f,
            revno: idVal & 0x0f
        }
        return values
    }

    /**
     * Check if the sensor is enabled
     * @return {Promise<boolean>}
     */
    async isEnabled() {
        this.$checkInit()
        let res = (await this.$readRegister(REGISTERS.CONTROL))[0]
        return (res & 0x03) != 0
    }

    /**
     * Get the broadband channel measure
     * @return {Promise<number>}
     */
    async getBroadband() {
        this.$checkInit()
        let res = await this.$readRegister(REGISTERS.CHAN0_LOW, 2)
        return res[1] << 8 | res[0]
    }

    /**
     * Get the infrared channel measure
     * @return {Promise<number>}
     */
    async getInfrared() {
        this.$checkInit()
        let res = await this.$readRegister(REGISTERS.CHAN1_LOW, 2)
        return res[1] << 8 | res[0]
    }

    /**
     * Get the current Gain of the sensor
     *  0: 1x
     *  1: 16x
     * @return {Promise<number>}
     */
    async getGain() {
        this.$checkInit()
        let res = (await this.$readRegister(REGISTERS.TIMING))[0]
        return res >> 4 & 0x01
    }

    /**
     * Set the gain of the sensor
     *  0: 1x
     *  1: 16x
     * @param value
     * @return {Promise<Tsl2561>}
     */
    async setGain(value) {
        this.$checkInit()
        value &= 0x01
        value <<= 4
        let current = await this.$readRegister(REGISTERS.TIMING)
        await (new Promise((resolve, reject) => {
            let writeBuffer = Buffer.alloc(2)
            writeBuffer[0] = COMMAND_BIT | REGISTERS.TIMING
            writeBuffer[1] = (current & 0xef) | value
            this.i2c.i2cWrite(this.address, writeBuffer.length, writeBuffer, (err) => {
                if (err)
                    return reject(err)
                return resolve()
            })
        }))
        return this
    }

    /**
     * Get the lux measure of the sensor
     * @return {Promise<number>}
     */
    async getLux() {
        this.$checkInit()

        let channel0, channel1, integration, gain, lux = null;

        channel0 = await this.getBroadband()
        channel1 = await this.getInfrared()
        integration = await this.getIntegrationTime()
        gain = await this.getGain()

        if (channel0 == 0 ||
            channel0 > CLIP_THRESHOLD[integration] ||
            channel1 > CLIP_THRESHOLD[integration]) {

            return null
        }

        let ratio = channel1 / channel0

        if (ratio >= 0 && ratio <= 0.5) {
            lux = 0.0304 * channel0 - 0.062 * channel0 * Math.pow(ratio, 1.4)
        } else if (ratio <= 0.61) {
            lux = 0.0224 * channel0 - 0.031 * channel1
        } else if (ratio <= 0.80) {
            lux = 0.0128 * channel0 - 0.0153 * channel1
        } else if (ratio <= 1.30) {
            lux = 0.00146 * channel0 - 0.00112 * channel1
        } else {
            lux = 0
        }

        lux *= SCALES.GAIN[gain]
        lux *= SCALES.TIME[integration]

        return lux
    }

    /**
     * Get the integration time of the sensor
     *  0: 13.7ms
     *  1: 101ms
     *  2: 402ms
     *  3: manual
     * @return {Promise<number>}
     */
    async getIntegrationTime() {
        this.$checkInit()
        let res = (await this.$readRegister(REGISTERS.TIMING))[0]
        return res & 0x03
    }

    /**
     * Set the integration time of the sensor
     *  0: 13.7ms
     *  1: 101ms
     *  2: 402ms
     *  3: manual
     * @return {Promise<Tsl2561>}
     */
    async setIntegrationTime(value) {
        this.$checkInit()
        value &= 0x01
        let current = await this.$readRegister(REGISTERS.TIMING)
        await (new Promise((resolve, reject) => {
            let writeBuffer = Buffer.alloc(2)
            writeBuffer[0] = COMMAND_BIT | REGISTERS.TIMING
            writeBuffer[1] = (current & 0xfc) | value
            this.i2c.i2cWrite(this.address, writeBuffer.length, writeBuffer, (err) => {
                if (err)
                    return reject(err)
                return resolve()
            })
        }))
        return this
    }

    /**
     * Read a register on the sensor
     * @param registerAddr The address of the register
     * @param count The number of bytes to read
     * @return {Promise<Buffer>}
     */
    $readRegister(registerAddr, count = 1) {

        return new Promise((resolve, reject) => {

            let writeBuffer = Buffer.alloc(1)
            writeBuffer[0] = COMMAND_BIT | registerAddr

            if (count > 1) {
                writeBuffer[0] |= WORD_BIT
            }

            this.i2c.i2cWrite(this.address, writeBuffer.length, writeBuffer, (err) => {
                if (err) {
                    return reject(err)
                }

                let receivedBytes = Buffer.alloc(count)
                this.i2c.i2cRead(this.address, count, receivedBytes, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(receivedBytes)
                })

            })

        })
    }

    /**
     * Write a command to the control register
     * @param value The value of the command
     * @return {Promise<Tsl2561>}
     */
    $writeControlRegister(value) {

        return new Promise((resolve, reject) => {

            let writeBuffer = Buffer.alloc(2)
            writeBuffer[0] = COMMAND_BIT | REGISTERS.CONTROL
            writeBuffer[1] = value

            this.i2c.i2cWrite(this.address, writeBuffer.length, writeBuffer, (err) => {
                if (err) {
                    return reject(err)
                }

                resolve(this)
            })

        })
    }

    /**
     * Check if the i2c bus is initialized and throw an error if not
     */
    $checkInit() {
        if (!this.i2c)
            throw new Error("Tsl2561 i2c bus not initialized, use 'init' function before using the class")
    }

}

module.exports = Tsl2561