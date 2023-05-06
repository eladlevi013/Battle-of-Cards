import express from "express";
const router = express.Router();
import mongoose from "mongoose";
import Account from "../models/account.js";

router.post('/registerScore', async(request,response) => {
    //Get account info from body
    const {username, score} = request.body;

    //Check if user exists
    Account.findOne({username: username})
    .then(account => {
        if(account)
        {
            // update score
            if(score > account.score)
            {
                account.score = score;
                account.save()
                .then(results => {
                    return response.status(200).json({
                        results: results
                    })
                })
                .catch(error => {console.log(error.message)})
            }
        }
        else
        {
            // create account in db
            const id = new mongoose.Types.ObjectId();
            const _account = new Account({
                _id: id,
                username: username,
                score: score
            })
            _account.save()
            .then(results => {
                return response.status(200).json({
                    results: results
                })
            })
            .catch(error => {console.log(error.message)})
        }
    })
    .catch(error => {console.log(error.message)})
})

export default router;