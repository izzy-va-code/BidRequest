"use strict"
const fs = require('fs')
const parser = require('ua-parser-js')
const csvtojson = require('csvtojson')
const json2csv = require('json2csv').parse
const djv = require('djv')
const fastify = require('fastify')({
    logger: true
})

const env = new djv({ version: 'draft-04' })
const requestSchema = require('./request-schema')
const devicesListPath = './DevicesList.csv'
const fields = ["devicetype", "make", "model", "os", "osv", "hwv"]
var optsJson2Csv = { fields, header: false }

// Headers check on start
try {
    if(fs.existsSync(devicesListPath)){
        csvtojson().fromFile(devicesListPath).on('header', (headers) => {
            console.log("File has headers: " + headers)
            console.log(fields)
            if(headers.equals(fields)){
                console.log("Headers equal fields.")
                optsJson2Csv.header = false
            }
            else {
                console.log("Headers are not equal to fields. Setting headers.")
                optsJson2Csv.header = true
            }
        })
    }
    else{
        optsJson2Csv.header = true
    }
} catch(err) {
    console.error(err)
}
// Declare routes
fastify.post('/bidrequest', function (request, reply) {
    env.addSchema('requestSchema', requestSchema)

    let validError = env.validate('requestSchema', request.body)

    if(validError){
        console.log("Validation error:")
        console.log(validError)
        reply.code(400).send(validError)
    }
    else {
        console.log("Validation successful")
        let res = parseUserAgent(request.body)
        if(res){
            const csv = json2csv(res, optsJson2Csv)
            fs.appendFile(devicesListPath, csv + '\n', (err) => {
                if (err) throw err
                console.log('The file has been saved!')
                reply   .code(200)
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send({ Message: 'Succesfull' })
                optsJson2Csv.header = false
            })

        }
        else console.log("No device object")
    }
})

// Equals function
Array.prototype.equals = function (array) {
    if (!array)
        return false;

    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            return false;
        }
    }

    return true;
}

// Parsing function
function parseUserAgent(obj){
    if(obj.device){
        var result = {  devicetype:undefined,
                        make:undefined,
                        model:undefined,
                        os:undefined,
                        osv:undefined,
                        hwv:undefined }

        var ua = parser(obj.device.ua)

        if(ua.device.type) result.devicetype = ua.device.type

        if(ua.device.vendor) result.make = ua.device.vendor

        if(ua.device.model) result.model = ua.device.model

        if(ua.os.name) result.os = ua.os.name

        if(ua.os.version) result.osv = ua.os.version

        if(obj.device.hwv) result.hwv = obj.device.hwv

        console.log(ua)
        console.log(result)
        return result
    }
    else return null
}

// Run the server!
fastify.listen(3000, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})