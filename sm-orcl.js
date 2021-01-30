const util = require('util');
const fs = require('fs')
const execPromissse = util.promisify(require('child_process').exec)

let error = ""
let data = ""

async function exec(command) {
  let { error, stdout, stderr } = await execPromissse(command)
  if (stdout) {
    let cacheStdout = stdout.replace(/\t/g, ' ').split("\n").filter(el => { return el != '' })
    stdout = cacheStdout
  }
  return { error, stdout, stderr }
}

function regErrosDatabase(msg) {
  let ts = Date()
  let path = __dirname + '/sm-orcl.log'
  msg = `\n [ ${ts} ] > ${JSON.stringify(msg)}`
  fs.appendFileSync(path, msg, err => console.log(err))
}

class ORACLE {
  constructor({ username: username, passowrd: passowrd, ip_address: ip_address, port: port, service_name: service_name }) {
    this.username = username, this.passowrd = passowrd, this.ip_address = ip_address, this.port = port ?? 1521, this.service_name = service_name
  }

  objToArrayWithComparisionOfAny(data, arrow) {
    let caracter = "="
    if (arrow) caracter = arrow
    let obj = []
    let objDataKeys = Object.keys(data)
    let objDataValues = Object.values(data)
    let idx = 0
    for (const ky of objDataKeys) {
      obj.push(`${ky} ${caracter} \'${objDataValues[idx]}\'`)
      idx++
    }
    return obj
  }

  tns_connect() {
    return `${this.username}/${this.passowrd}@(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=${this.ip_address})(PORT=${this.port})))(CONNECT_DATA=(SERVICE_NAME=${this.service_name})))`
  }

  checkIrregularity(output) {
    if (!output) return { status: 404, data: [], error: 'Not data found' }
    for (let i of output) {
      if (!output) return { status: 404, data: [], error: 'Not data found' }
      if (i.search('ORA-') !== -1) return { status: 500, data: [], error: i }
      if (i.search('0 rows deleted') !== -1) return { status: 404, data: [], error: i }
      if (i.search('no rows selected') !== -1) return { status: 404, data: [], error: i }
    }
  }

  async sqlplus(sql) {
    console.log(sql)
    try {
      const response = await (await exec(`export NLS_LANG=AMERICAN_AMERICA.UTF8 \n sqlplus -s "${this.tns_connect()}" <<EOF \n set long 35000 \n set longchunksize 30000 \n set pages 0 \n set lines 32767 \n ${sql} \nEOF`)).stdout
      data = response
      let existIrregularity = this.checkIrregularity(data)
      if (existIrregularity) {
        regErrosDatabase(existIrregularity.error)
        return existIrregularity
      }
      return { status: 200, data: data, error: error }
    } catch (error) {
      return { status: 500, data: data, error: "Internal Server Error" }
    }
  }

  async keepAliveDb() {
    let res = await this.sqlplus('select 1 from dual;')
    if (res.status === 500) return { status: 0, output: "Failed to connect" }
    return { status: 1, output: "Successfully connected" }
  }

  async insert({ table, data }) {
    let valuesData = ""

    if (data.length != undefined && data.length > 0) {
      let selects = []
      let selectsResolved = []
      for (let i of data) {
        let values = ""
        let ctx = 0
        for (let vlr of Object.values(i)) {
          values = `${values} '${vlr}' as ${Object.keys(i)[ctx]},`
          ctx += 1
        }
        selects.push(`select ${values} from dual union all`.replace(', from', ' from'))
      }

      for (let index = 0; index < selects.length; index++) {
        if (index === selects.length - 1) {
          selectsResolved.push(selects[index].replace('union all', ''))
        } else {
          selectsResolved.push(selects[index])
        }
      }

      let selectsAll = ""
      for (let index = 0; index < selectsResolved.length; index++) {
        if (index === selects.length - 1) {
          selectsAll = `${selectsAll} ${selectsResolved[index]}`
        } else {
          selectsAll = `${selectsAll} ${selectsResolved[index]}\n`
        }

      }

      let sql = `
ALTER SESSION FORCE PARALLEL DML PARALLEL 5;
commit;
insert /*+ NOAPPEND PARALLEL */
into ${table}(${Object.keys(data[0])})
select * from (
  ${selectsAll}
);
commit;
ALTER SESSION DISABLE PARALLEL DML;
`

      console.log(sql)
      let number_random = Math.round(Math.random() * 1000)
      let file_name = __dirname + '/insert_sql_' + number_random + '.sql'
      fs.writeFileSync(file_name, sql, err => console.log(err))
      let res = await this.sqlplus(`@"${file_name}"`)
      fs.unlinkSync(file_name, err => console.log(err))
      return res
    }

    for (const value of Object.values(data)) valuesData = valuesData + ',' + `'${value}'`

    let res = await this.sqlplus(`insert into ${table} ( ${Object.keys(data)} ) values ( ${valuesData.replace(",", "")} );`)
    return res

  }

  async insertSelect({ tablePrimary, columnsPrimary, tableSource, columnsSource, where, handsFreeWhere }) {
    let isExistWhere = ";"
    let objWhere = []

    if (where) {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    } else if (handsFreeWhere) {
      isExistWhere = " where " + handsFreeWhere + ";"
    }

    let res = await this.sqlplus(`insert into ${tablePrimary} ( ${columnsPrimary} ) select ${columnsSource} from ${tableSource} ${isExistWhere}`)
    return res
  }

  async update({ table, data, updateAll, where, handsFreeWhere }) {
    let isExistWhere = ";"
    let objUpdate = this.objToArrayWithComparisionOfAny(data)
    let objWhere = []
    if (updateAll) {
      isExistWhere = ";"
    } else if (where) {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    } else if (handsFreeWhere) {
      isExistWhere = " where " + handsFreeWhere + ";"
    }
    let res = await this.sqlplus(`update ${table} set ${objUpdate} ${isExistWhere}`)
    return res
  }

  async delete({ table, deleteAll, where, handsFreeWhere }) {
    let isExistWhere = ";"
    let objWhere = []
    if (deleteAll) {
      isExistWhere = ";"
    } else if (where) {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    } else if (handsFreeWhere) {
      isExistWhere = " where " + handsFreeWhere + ";"
    }
    let res = await this.sqlplus('delete ' + table + isExistWhere)
    return res
  }

  async truncate({ table }) {
    let dml = `TRUNCATE TABLE ${table};`
    let res = await this.sqlplus(dml)
    return res
  }

  async selectOffSet({ table, columns, offset, offSetReturn, where, handsFreeWhere }) {
    let isExistWhere
    let objWhere = []

    if (where) {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ')
    } else if (handsFreeWhere) {
      isExistWhere = " where " + handsFreeWhere
    }

    let pagOffset

    if (offset && offSetReturn) {
      pagOffset = `offset ${offset * offSetReturn} rows fetch next ${offSetReturn} rows only`
    }

    if (!columns || columns.length === 1 && columns[0] === '*') columns = await this.fetchColumnsTable({ table: table })

    let col = Array.from(columns).map((arry, idx) => {
      if (idx !== columns.length - 1) return arry + "||'|'||"
      return arry
    }).join(',').replace(/,/g, '').trim()

    let query = `select ${col.replace(/[ ]/g, ",")} from ${table} ${isExistWhere} ${pagOffset};`
    console.log(query)
    let res = await this.sqlplus(query)

    let obj = []
    if (res.data && res.error === '') {
      for (const v of res.data) {
        let newObj = {}
        let data = v.toString().split("|")
        for (let index = 0; index < data.length; index++) {
          if (data[index].search('rows selected') === -1)
            newObj[columns[index]] = data[index].toString().trim()
        }
        if (Object.values(newObj).length !== 0) obj.push(newObj)
      }
      res.data = obj
    }
    return res
  }

  async select({ table, columns, where, handsFreeWhere }) {
    let isExistWhere = ";"
    let objWhere = []

    if (!columns || columns.length === 1 && columns[0] === '*') columns = await this.fetchColumnsTable({ table: table })

    let col = Array.from(columns).map((arry, idx) => {
      if (idx !== columns.length - 1) return arry + "||'|'||"
      return arry
    }).join(',').replace(/,/g, '').trim()

    if (where) {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    } else if (handsFreeWhere) {
      isExistWhere = " where " + handsFreeWhere + ";"
    }

    let query = `select ${col.replace(/[ ]/g, ",")} from ${table} ${isExistWhere}`
    let res = await this.sqlplus(query)

    let obj = []
    if (res.data && res.error === '') {
      for (const v of res.data) {
        let newObj = {}
        let data = v.toString().split("|")
        for (let index = 0; index < data.length; index++) {
          if (data[index].search('rows selected') === -1)
            newObj[columns[index]] = data[index].toString().trim()
        }
        if (Object.values(newObj).length !== 0) obj.push(newObj)
      }
      res.data = obj
    }
    return res
  }

  async fetchColumnsTable({ table }) {
    let descTable = await this.sqlplus(`select lower(COLUMN_NAME) as COLUMN_NAME from user_tab_columns where table_name = upper('${table}');`)
    let arry = []
    for (const col of descTable.data) {
      if (col.search('rows selected') === -1)
        arry.push(col)
    }
    return arry
  }

  async exec_procedure({ procedure_name, data }) {
    let value = this.objToArrayWithComparisionOfAny(data, '=>')
    let query = `begin \n ${procedure_name}(${value});\n end; \n/`
    let res = await this.sqlplus(query)
    return res
  }

  async exec_function({ function_name, data }) {
    let value = this.objToArrayWithComparisionOfAny(data, '=>')
    let query = `select ${function_name}(${value}) as response from dual;`
    let res = await this.sqlplus(query)
    return res
  }

  async drop_table({ table, casc }) {
    let cascConst = ";"
    if (casc) cascConst = 'CASCADE CONSTRAINTS;'
    let dml = `DROP TABLE ${table} ${cascConst}`
    let res = await this.sqlplus(dml)
    return res
  }
}


module.exports = ORACLE 