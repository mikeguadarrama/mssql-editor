var express = require('express');
var router = express.Router();
const db = require('../helpers/mssql')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/tables', async (req, res, next) => {
  const data = await db.getTables()
  res.json(data)
})

router.get('/table/:table', async (req, res, next) => {

  const { table } = req.params

  const data = await db.getColumns(table)

  res.json(data)

})

router.post('/table/:table', async (req, res, next) => {
  const data = await db.insert(req.body.table, req.body.object)
  res.json(data)
})

router.get('/table/:table/preview', async (req, res, next) => {
  const { table } = req.params
  const data = await db.result(`SELECT TOP (50) * FROM [${table}]`)
  res.json(data)
})

router.get('/table/:table/all', async (req, res, next) => {
  const { table } = req.params
  const data = await db.result(`SELECT * FROM [${table}]`)
  res.json(data)
})

module.exports = router;
