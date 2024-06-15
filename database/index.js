
const MODE = process.env.MODE === "production";
/**
 * @type {string} default server uri
 */
const DATABASE_HOST = MODE ? process.env.MYSQLHOST : process.env.DEBUG_DB_HOST;
const DATABASE_LANG = "mysql";
/**
 * @type {string} database common name
 */
const DATABASE_NAME = MODE ? process.env.MYSQL_DATABASE : process.env.DEBUG_DB_NAME;
/**
 * @type {string} database common username
 */
const DATABASE_USER = MODE ? process.env.MYSQLUSER : process.env.DEBUG_DB_USER;
/**
 * @type {string} database common password
 */
const DATABASE_PASS = MODE ? process.env.MYSQLPASSWORD : process.env.DEBUG_DB_PASS;

/**
 * @type {number} database common port
 */
const DATABASE_PORT = MODE ? process.env.MYSQLPORT : process.env.DEBUG_DB_PORT;
/**
 * Call for initialization
 */
const {Sequelize} = require('sequelize');
/**
 *
 * @type {BelongsTo<Model, Model> | Model<any, any> | Sequelize | Transaction}
 */
const dbConn = new Sequelize(DATABASE_NAME, DATABASE_USER, DATABASE_PASS, {
    host: DATABASE_HOST,
    dialect: DATABASE_LANG,
    port: DATABASE_PORT,
    logging: (e) => {
        //write to log file here...
        // console.log("in");
    },
});

module.exports = dbConn;