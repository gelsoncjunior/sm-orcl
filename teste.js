const ORACLE = require('./sm-orcl')

const orcl = new ORACLE({
  ip_address: "192.168.85.5",
  username: "bgode",
  passowrd: "Bgode2020",
  service_name: "TSTDBPRD01",
  port: 1521
})

async function main() {
  //let data = await orcl.select({ table: "be_user", columns: ["id", "name"], where: { id: 2121 } })
  let data = await orcl.exec_procedure({ procedure_name: "CREATE_USER", data: { name: "Gelson Carlos", tax_id: "161.391.677-95" } })
  console.log(data)
}

main()