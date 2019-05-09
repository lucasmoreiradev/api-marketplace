const Ad = require('../models/ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const PurchaseMail = require('../jobs/PurchaseMail')
const Queue = require('../services/Queue')

class PurchaseController {
  async store (req, res) {
    const { ad, content } = req.body
    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)
    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()

    const purchase = await Purchase.create({
      content,
      ad: purchaseAd,
      user
    })

    return res.send(purchase)
  }

  async accept (req, res) {
    const { id } = req.params
    const { ad } = await Purchase.findById(id).populate({
      path: 'ad',
      populate: {
        path: 'author'
      }
    })

    if (!ad.author._id.equals(req.userId)) {
      return res.status(401).json({ error: "You're not the ad author" })
    }

    ad.purchasedBy = id

    const savedAd = await ad.save()

    return res.json(savedAd)
  }
}

module.exports = new PurchaseController()
