const util = require('util');
const execPromissse = util.promisify(require('child_process').exec)

var error = ""
var data = ""

async function exec(command) {
  const { error, stdout, stderr } = await execPromissse(command)
  return { error, stdout, stderr }
}

class ORACLE {
  constructor({ username: username, passowrd: passowrd, ip_address: ip_address, port: port, service_name: service_name }) {
    this.username = username, this.passowrd = passowrd, this.ip_address = ip_address, this.port = port ?? 1521, this.service_name = service_name
  }

  tns_connect() {
    return `${this.username}/${this.passowrd}@(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=${this.ip_address})(PORT=${this.port})))(CONNECT_DATA=(SERVICE_NAME=${this.service_name})))`
  }

  search_ora(output) {
    for (let i of output) {
      for (let x of i) {
        if (x.search('ORA-') !== -1) {
          return {
            status: 500,
            data: [],
            error: x
          }
        }
      }
    }
  }

  async sqlplus(sql) {
    try {
      const response = await (await exec(`export NLS_LANG=AMERICAN_AMERICA.UTF8 \n sqlplus -s "${this.tns_connect()}" << EOF \n set pages 0 \n ${sql} \nEOF`)).stdout
      data = response.split("\n").map(arry => { return arry.split("\t") }).filter(el => { return el != '' })
      //console.log(data)
      if (this.search_ora(data)) return this.search_ora(data)
      return { status: 200, data: data[0], error: error }
    } catch (error) {
      console.log(error)
      return { status: 500, data: data, error: "Internal Server Error" }
    }
  }

  async keepAliveDb() {
    let res = await this.sqlplus('select 1 from dual;')
    if (res.status === 500) return { status: 0 }
    return { status: 1 }
  }

  async insert({ table, data }) {
    var patchDataValues = `\'${Object.values(data).join(',').replace(/,/g, '\',\'')}\'`
    let res = await this.sqlplus(`insert into ${table} ( ${Object.keys(data)} ) values ( ${patchDataValues} );`)
    return res
  }

  objToArrayWithComparisionOfAny(data) {
    let obj = []
    let objDataKeys = Object.keys(data)
    let objDataValues = Object.values(data)
    let idx = 0
    for (const ky of objDataKeys) {
      obj.push(`${ky} = \'${objDataValues[idx]}\'`)
      idx++
    }
    return obj
  }

  async update({ table, data, updateAll, where }) {
    var isExistWhere = ";"
    let objUpdate = this.objToArrayWithComparisionOfAny(data)
    var objWhere = []
    if (updateAll) {
      isExistWhere = ";"
    } else {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    }
    let res = await this.sqlplus(`update ${table} set ${objUpdate} ${isExistWhere}`)
    return res
  }

  async delete({ table, deleteAll, where }) {
    var isExistWhere = ";"
    var objWhere = []
    if (deleteAll) {
      isExistWhere = ";"
    } else {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    }
    let res = await this.sqlplus('delete ' + table + isExistWhere)
    return res
  }

  async query(query) {
    var scape
    if (query.search('begin') !== -1) scape = "/"
    let res = await this.sqlplus(`${query} \n ${scape}`)
    return res
  }

}

module.exports = ORACLE