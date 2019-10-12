"use strict"
const fs = require('fs')
const fastify = require('fastify')({
    logger: true
})
const validationSchema = {
    schema: {
        body: {
            type: 'object',
            properties: {
                id: {type: 'string'},
                imp: {type: 'array', items: { type: 'object' }},
                site: {type: 'object'},
                app: {type: 'object'},
                device: {type: 'object'},
                user: {type: 'object'},
                test: {type: 'integer'},
                at: {type: 'integer'},
                cur: {type: 'array',  items: { type: 'string' }},
                bcat: {type: 'array', items: { type: 'string' }},
                badv: {type: 'array', items: { type: 'string' }},
                source: {type: 'object'},
                regs: {type: 'object'},
                ext: {type: 'object'},
            },
            required: ['id', 'imp', 'at' , 'cur']
        }
    }
}

// Declare routes
fastify.post('/bidrequest',{validationSchema, attachValidation:true}, function (request, reply) {
    if (request.validationError) {
        reply.code(400).send(request.validationError)
    }
    else {
        var res = parseDevice(request.body)
        if(res){
            fs.appendFile('DevicesList.txt', JSON.stringify(res) + '\n', (err) => {
            if (err) throw err
            console.log('The file has been saved!')
            reply   .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send({ Message: 'Succesfull' })
            })
        }
        else console.log("Not");
    }

})

// Parsing function
function parseDevice(obj){
    if(obj.device){
        let dev = obj.device;
        if(dev.devicetype || dev.make || dev.model || dev.os || dev.osv || dev.hwv){
            let parseResult= {};
            parseResult.id = obj.id
            parseResult.devicetype = dev.devicetype
            parseResult.make = dev.make
            parseResult.model = dev.model
            parseResult.os = dev.os
            parseResult.osv = dev.osv
            parseResult.hwv = dev.hwv
            console.log(JSON.stringify(parseResult))
            return parseResult
        }
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