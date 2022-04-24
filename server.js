if (process.env.NODE_ENV !== "production") { // a production environment contains just the final version of the product
    require('dotenv').load() // dotenv is a zero-dependency module that loads environment variables from a .env file into process.env
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

// include modules
const express = require('express')
const res = require('express/lib/response')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/store', function (req, res) {
    fs.readFile('items.json', function (error, data) {
        if (error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data) // inject data into template: store.ejs
            })
        }
    })
})

app.post('/purchase', function (req, res) {
    fs.readFile('items.json', function (error, data) {
        if (error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0
            req.body.items.forEach(function (item) {
                const itemJson = itemsArray.find(function (i) {
                    return i.id == item.id
                })
                total = total + itemJson.price * item.quantity
            })

            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then(function () {
                console.log('CHARGE SUCCEEDED')
                res.json({
                    message: 'Successfully purchased items'
                })
            }).catch(function () {
                console.log('CHARGE FAILED')
                res.status(500).end()
            })
        }
    })
})

app.listen(8080)