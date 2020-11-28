const util = require('util');
const os = require('os');

const sys = {
  darwin: 'export',
  win32: 'set'
}

const execPromissse = util.promisify(require('child_process').exec)

var error = ""
var data = ""

async function exec(command) {
  var { error, stdout, stderr } = await execPromissse(command)
  if (stdout) {
    let cacheStdout = stdout.replace(/\t/g, ' ').split("\n").filter(el => { return el != '' })
    stdout = cacheStdout
  }
  return { error, stdout, stderr }
}

class ORACLE {
  constructor({ username: username, passowrd: passowrd, ip_address: ip_address, port: port, service_name: service_name }) {
    this.username = username, this.passowrd = passowrd, this.ip_address = ip_address, this.port = port ?? 1521, this.service_name = service_name
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

  tns_connect() {
    return `${this.username}/${this.passowrd}@(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=${this.ip_address})(PORT=${this.port})))(CONNECT_DATA=(SERVICE_NAME=${this.service_name})))`
  }

  search_ora(output) {
    if (!output) return { status: 404, data: [], error: 'Not data found' }
    for (let i of output) {
      if (i.search('ORA-') !== -1) return { status: 500, data: [], error: i }
      if (!output) return { status: 404, data: [], error: 'Not data found' }
      if (i.search('0 rows deleted') !== -1) return { status: 404, data: [], error: i }
    }
  }

  async sqlplus(sql) {
    try {
      const response = await (await exec(`${sys[os.platform()]} NLS_LANG=AMERICAN_AMERICA.UTF8 \n sqlplus -s "${this.tns_connect()}" <<EOF \n set pages 0 \n set lines 500 \n ${sql} \nEOF`)).stdout
      data = response
      if (this.search_ora(data)) return this.search_ora(data)
      return { status: 200, data: data, error: error }
    } catch (error) {
      console.log(error)
      return { status: 500, data: data, error: "Internal Server Error" }
    }
  }

  async keepAliveDb() {
    let res = await this.sqlplus('select 1 from dual;')
    if (res.status === 500) return { status: 0, output: "Failed to connect" }
    return { status: 1, output: "Successfully connected" }
  }

  async insert({ table, data, where, handsFreeWhere }) {
    var isExistWhere = ";"
    var objWhere = []

    if (where) {
      objWhere = this.objToArrayWithComparisionOfAny(where)
      isExistWhere = " where " + objWhere.join(',').replace(/,/g, ' and ') + ";"
    } else if (handsFreeWhere) {
      isExistWhere = " where " + handsFreeWhere + ";"
    }
    let valuesData = ""
    for (const value of Object.values(data)) {
      valuesData = valuesData + ',' + `"${value}"`
    }
    let res = await this.sqlplus(`insert into ${table} ( ${Object.keys(data)} ) values ( ${patchDataValues} )` + isExistWhere)
    return res
  }

  async update({ table, data, updateAll, where, handsFreeWhere }) {
    var isExistWhere = ";"
    let objUpdate = this.objToArrayWithComparisionOfAny(data)
    var objWhere = []
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
    var isExistWhere = ";"
    var objWhere = []
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
    var isExistWhere = ";"
    var objWhere = []
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

  async query(query) {
    var scape = ""
    if (query.search('begin') !== -1) scape = "/"
    let res = await this.sqlplus(`${query} \n ${scape}`)
    return res
  }

  async create_table({ table, columns, trigger }) {
    let columnsTable = []
    let columnsUniq = []
    let sequence = ""
    let idPk = ""
    for (const c of columns) {
      let objValue = Object.values(c)
      if (c.pk) {
        idPk = c.name
        columnsTable.push(`${objValue[0]} ${objValue[1]}${objValue[2]} constraint ${table}_PK primary key`)
        if (c.seq) {
          sequence = `
          CREATE SEQUENCE "${table}_SEQ"  MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 1 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE  GLOBAL;
          /
          `
        }
      } else if (c.nullable) {
        columnsTable.push(`${objValue[0]}  ${objValue[1]}${objValue[2]} not null`)
      } else {
        columnsTable.push(`${objValue[0]}  ${objValue[1]}${objValue[2]}`)
      }

      if (c.unique && !c.pk) {
        columnsUniq.push(`alter table ${table} add constraint ${table}_${objValue[0].toUpperCase()}_UQ unique (${objValue[0]}); \n`)
      }
    }
    let dml = `
      create table ${table} (
        ${columnsTable}
      );
      /
  
    `
    if (columnsUniq) dml = dml + columnsUniq.join(',').replace(/,/g, '')

    if (sequence) dml = dml + sequence

    if (trigger) {
      let seq_querys = `:new.${idPk} := to_number(sys_guid(), 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');`
      if (sequence) seq_querys = `select "${table}_SEQ".nextval into :NEW."${idPk.toUpperCase()}" from sys.dual;`
      dml = dml + `
      create or replace trigger biu_${table}
      before insert or update on ${table}
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

      ALTER TRIGGER  "BIU_${table}" ENABLE
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