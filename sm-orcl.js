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
    try {
      const response = await (await exec(`export NLS_LANG=AMERICAN_AMERICA.UTF8 \n sqlplus -s "${this.tns_connect()}" <<EOF \n set long 30000 \n set longchunksize 30000 \n set pages 0 \n set lines 2000 \n ${sql} \nEOF`)).stdout
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

    let query = `select ${col.replace(/[ ]/g, ",")} from ${table}` + isExistWhere
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

  async create_table({ table_name, columns, trigger }) {
    let columnsTable = []
    let columnsUniq = []
    let sequence = ""
    let idPk = ""
    for (const c of columns) {
      let objValue = Object.values(c)
      if (c.pk) {
        idPk = c.name
        columnsTable.push(`${objValue[0]} ${objValue[1]}${objValue[2]} constraint ${table_name}_PK primary key`)
        if (c.seq) {
          sequence = `
          CREATE SEQUENCE "${table_name}_SEQ"  MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 1 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE  GLOBAL;
          /
          `
        }
      } else if (c.nullable) {
        columnsTable.push(`${objValue[0]}  ${objValue[1]}${objValue[2]} not null`)
      } else {
        columnsTable.push(`${objValue[0]}  ${objValue[1]}${objValue[2]}`)
      }

      if (c.unique && !c.pk) {
        columnsUniq.push(`alter table ${table_name} add constraint ${table_name}_${objValue[0].toUpperCase()}_UQ unique (${objValue[0]}); \n`)
      }
    }
    let dml = `
      create table ${table_name} (
        ${columnsTable}
      );
      /
  
    `
    if (columnsUniq) dml = dml + columnsUniq.join(',').replace(/,/g, '')

    if (sequence) dml = dml + sequence

    if (trigger) {
      let seq_querys = `:new.${idPk} := to_number(sys_guid(), 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');`
      if (sequence) seq_querys = `select "${table_name}_SEQ".nextval into :NEW."${idPk.toUpperCase()}" from sys.dual;`
      dml = dml + `
      create or replace trigger biu_${table_name}
      before insert or update on ${table_name}
      for each row
      begin
          if inserting then
              if :new.id is null then
                  ${seq_querys}
              end if;
          end if;
          if updating then
              null;
          end if;
      end;
      /

      ALTER TRIGGER  "BIU_${table_name}" ENABLE
      /
      `
    }

    let res = await this.sqlplus(dml)
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