const Oracle = require('./sm-orcl')

const auth = {
  ip_address: '192.168.85.5',
  username: 'bgode',
  passowrd: 'Bgode2020',
  service_name: 'TSTDBPRD01',
  port: 1521
}


const orcl = new Oracle(auth)

let data = {
  name: "Gelson Junior",
  stored_password: "kknd2010",
  email_address: "gelson.carlos@oceandeep.com.br",
  tax_id: "16139167795"
}

let where = {
  uuid: "857137d5-d601-431d-b953-708dc1aa6725",
  id: 960
}

//orcl.insert({ table: 'be_user', data: data }).then(data => console.log(data)).catch(err => console.log(err))
//orcl.update({ table: 'be_user', data: data }).then(data => console.log(data)).catch(err => console.log(err))
//orcl.query(`select id from be_user where id = 960;`).then(data => console.log(data)).catch(err => console.log(err))
//orcl.remove({ table: 'be_user', deleteAll: true, where: where }).then(data => console.log(data)).catch(err => console.log(err))