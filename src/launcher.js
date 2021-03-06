import fs from 'fs-extra'
import ChromeDriver from 'chromedriver'

import getFilePath from './utils/getFilePath'

const DEFAULT_LOG_FILENAME = 'chromedriver.log'

const DEFAULT_CONNECTION = {
    protocol: 'http',
    hostname: 'localhost',
    port: 9515,
    path: '/'
}

const isMultiremote = obj => typeof obj === 'object' && !Array.isArray(obj)
const isChrome = cap => cap.browserName.toLowerCase() === 'chrome'

export default class ChromeDriverLauncher {
    constructor(options, capabilities, config) {
        this.options = {
            protocol: options.protocol || DEFAULT_CONNECTION.protocol,
            hostname: options.hostname || DEFAULT_CONNECTION.hostname,
            port: options.port || DEFAULT_CONNECTION.port,
            path: options.path || DEFAULT_CONNECTION.path,
        }

        this.outputDir = options.outputDir || config.outputDir
        this.capabilities = capabilities
        this.chromeDriverArgs = []
    }

    async onPrepare() {
        this.chromeDriverArgs.push(`--port=${this.options.port}`)
        this.chromeDriverArgs.push(`--url-base=${this.options.path}`)

        /**
         * update capability connection options to connect
         * to chromedriver
         */
        this._mapCapabilities()

        this.process = await ChromeDriver.start(this.chromeDriverArgs, true)

        if (typeof this.outputDir === 'string') {
            this._redirectLogStream()
        }
    }

    onComplete() {
        ChromeDriver.stop()
    }

    _redirectLogStream() {
        const logFile = getFilePath(this.outputDir, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        fs.ensureFileSync(logFile)

        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        this.process.stdout.pipe(logStream)
        this.process.stderr.pipe(logStream)
    }

    _mapCapabilities() {
        if (isMultiremote(this.capabilities)) {
            for (const cap in this.capabilities) {
                if (isChrome(this.capabilities[cap])) {
                    Object.assign(this.capabilities[cap], this.options)
                }
            }
        } else {
            for (const cap of this.capabilities) {
                if (isChrome(cap)) {
                    Object.assign(cap, this.options)
                }
            }
        }
    }
}
