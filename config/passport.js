import passportLocal from 'passport-local';
import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const LocalStrategy = passportLocal.Strategy;

export default function (passport) {
    passport.use(new LocalStrategy({ usernameField: "username" }, async function (username, password, done) {
        // Match User
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { message: "This username is not registered" });
            }

            // Match Password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: "Incorrect Password" });
            } else {
                return done(null, user);
            }

        } catch (err) {
            console.error(err.message);
        }
    }));

    passport.serializeUser(async function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(async function (id, done) {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            console.error(err.message);
        }
    });
}