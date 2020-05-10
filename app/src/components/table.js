import React, { useState, useEffect, useReducer, useCallback, useRef } from 'react'
import TableComponent from './table-component'
import { Link } from 'react-router-dom'

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_KEY":
            return { ...state, object: { ...state.object, [action.data.key]: action.data.value } }
        default:
            return { ...state }
    }
}

const Table = props => {

    const [state, dispatch] = useReducer(reducer, { object: {} })
    const { object } = state
    const [columns, setColumns] = useState(null)
    const [preview, setPreview] = useState(null)
    const [required, setRequired] = useState([])
    const [errors, setErrors] = useState([])
    const [fks, setFKS] = useState(null)
    const [isInserting, setIsInserting] = useState(false)
    const [onlyRequired, setOnlyRequired] = useState(true)
    const table = props.match.params.table

    const formRef = useRef();

    useEffect(() => {
        fetch(`http://localhost:3001/table/${table}`)
            .then(res => res.json())
            .then(data => {
                console.log({ data })
                const constraints = data.data.reduce((acum, obj) => {
                    if (obj.CONSTRAINT_TYPE === "FOREIGN KEY" && typeof acum[obj.CONSTRAINT_NAME] === "undefined") {
                        acum[obj.CONSTRAINT_NAME] = { table: obj.REFERENCED_TABLE, column: obj.REFERENCED_COLUMN, data: null }
                    }
                    return acum
                }, {})
                console.log({ constraints })
                const required = data.data.reduce((acum, obj) => {
                    if (obj.IS_NULLABLE === "NO" && !obj.IS_IDENTITY && obj.CONSTRAINT_TYPE !== "PRIMARY_KEY") {
                        acum.push(obj.COLUMN_NAME)
                    }
                    return acum
                }, [])
                setRequired(required)
                setFKS(constraints)
                setColumns(data.data)
            })
        fetch(`http://localhost:3001/table/${table}/preview`)
            .then(res => res.json())
            .then(data => {
                console.log({ data })
                setPreview(data.data)
            })
    }, [table])

    useEffect(() => {
        setErrors([])
    }, [object])

    const submitRow = useCallback(() => {
        //check required
        let errors = []
        if (required.length > 0) {
            columns.forEach(column => {
                if (required.indexOf(column.COLUMN_NAME) > -1 && (!object[column.COLUMN_NAME] || !object[column.COLUMN_NAME].length === 0)) {
                    errors = [...errors, column.COLUMN_NAME]
                }
            })
            if (errors.length > 0) {
                setErrors(errors)
            }
        }
        console.log({ errors })
        if (!errors.length) {
            setIsInserting(true)
            fetch(`http://localhost:3001/table/${table}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ table, object })
            }).then(data => {
                console.log({ data })
                setIsInserting(false)
            }).catch(err => { setIsInserting(false); console.log({ err }) })
        }
    }, [required, columns, object, table])

    if (!columns) {
        return <p>Loading...</p>
    }

    const editValue = (key, value) => {
        dispatch({ type: 'SET_KEY', data: { key, value } })
    }

    const loadFK = (constraint) => {
        fetch(`http://localhost:3001/table/${fks[constraint].table}/all`)
            .then(res => res.json())
            .then(data => {
                setFKS(fks => ({ ...fks, [constraint]: { ...fks[constraint], data: data.data } }))
            })
    }

    const displayOptions = (item) => {
        //console.log({ item })
        return Object.keys(item).map(key => `${key}: ${item[key]}`).join(' / ')
    }

    const isRequired = (col) => {
        return col.IS_NULLABLE === "NO" && !col.IS_IDENTITY && col.CONSTRAINT_TYPE !== 'PRIMARY_KEY'
    }

    const processColumn = (col) => {
        if (col.IS_IDENTITY || col.CONSTRAINT_TYPE === "PRIMARY_KEY") {
            return <p className="form-control-static text-muted font-italic">Identity Key or Primary Key</p>
        }
        if (col.CONSTRAINT_TYPE === "FOREIGN KEY") {
            if (fks[col.CONSTRAINT_NAME].data === null) {
                return <button onClick={() => loadFK(col.CONSTRAINT_NAME)} type="button" className="btn btn-sm btn-light btn-block border border-secondary">Load FK values...</button>
            } else {
                return (
                    <select required={col.IS_NULLABLE === "NO"} className="form-control" value={state[col.COLUMN_NAME || ""]} onChange={e => editValue(col.COLUMN_NAME, e.target.value)}>
                        <option value="">Select...</option>
                        {fks[col.CONSTRAINT_NAME].data.map((item, idx) => (
                            <option key={idx} value={item[fks[col.CONSTRAINT_NAME].column]}>
                                {displayOptions(item)}
                            </option>
                        ))}
                    </select>
                )
            }
        }
        switch (col.DATA_TYPE) {
            case 'int':
            case 'bigint':
            case 'tinyint':
                return <input required={col.IS_NULLABLE === "NO"} type="number" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, +e.target.value)} className={`form-control ${errors.indexOf(col.COLUMN_NAME) > -1 && 'has-error'}`} step="0" />
            case 'decimal':
                return <input required={col.IS_NULLABLE === "NO"} type="number" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, +e.target.value)} className={`form-control ${errors.indexOf(col.COLUMN_NAME) > -1 && 'has-error'}`} />
            case 'nvarchar':
            case 'varchar':
                return <input invalid={errors.indexOf(col.COLUMN_NAME) > -1 ? 'true' : 'false'} required={col.IS_NULLABLE === "NO"} type="text" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, e.target.value)} className={`form-control ${errors.indexOf(col.COLUMN_NAME) > -1 && 'has-error'}`} placeholder={col.COLUMN_NAME} />
            case 'char':
                return <input required={col.IS_NULLABLE === "NO"} type="text" maxLength="1" rows="1" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, e.target.value)} className={`form-control w-auto ${errors.indexOf(col.COLUMN_NAME) > -1 && 'has-error'}`} placeholder={col.COLUMN_NAME} />
            case 'bit':
                return (
                    <div className="checkbox">
                        <input required={col.IS_NULLABLE === "NO"} type="checkbox" className={`${errors.indexOf(col.COLUMN_NAME) > -1 && 'has-error'}`} checked={state.object[col.COLUMN_NAME] || false} onChange={e => editValue(col.COLUMN_NAME, e.target.checked)} />
                    </div>
                )
            case 'date':
            case 'datetime':
            case 'datetime2':
                return <input required={col.IS_NULLABLE === "NO"} type="date" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, e.target.value)} className={`form-control ${errors.indexOf(col.COLUMN_NAME) > -1 && 'has-error'}`} />
            default:
                return <p className="alert alert-danger">No template for <strong>`{col.DATA_TYPE}`</strong></p>
        }
    }



    //const _cols = Object.keys(columns[0])

    //console.log({ state })

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col">
                    <h1>Table: {table}</h1>
                    <Link to="/" className="btn btn-sm btn-light border-secondary">Back</Link>
                    <hr />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <div className="form-group">
                        <div className="checkbox">
                            <label>
                                <input type="checkbox" checked={onlyRequired} onChange={e => setOnlyRequired(e.target.checked)} />
                                {' '} Show only required fields
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-12 col-sm-6">
                    <form ref={formRef} action="">
                        {columns.filter(k => onlyRequired ? k.IS_NULLABLE === "NO" : true).map((col, idx) => (
                            <div key={idx} className="form-group">
                                <label>{col.COLUMN_NAME} {isRequired(col) && <span className="text-danger">(required)</span>}</label>
                                {processColumn(col)}
                            </div>
                        ))}
                    </form>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <div className="form-group">
                        <button disabled={isInserting} onClick={submitRow} type="button" className="btn btn-primary">Add Row</button>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <p className="alert alert-info">{JSON.stringify(state.object)}</p>
                    <hr />
                    <TableComponent rows={columns} />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <h5 className="text-muted">Table Preview</h5>
                    <TableComponent rows={preview} />
                </div>
            </div>
        </div>

    )
}

export default Table