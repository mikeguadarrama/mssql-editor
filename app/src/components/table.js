import React, { useState, useEffect, useReducer } from 'react'
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
    const [columns, setColumns] = useState(null)
    const table = props.match.params.table

    useEffect(() => {
        fetch(`http://localhost:3001/table/${table}`)
            .then(res => res.json())
            .then(data => {
                console.log({ data })
                setColumns(data.data)
            })
    }, [table])

    if (!columns) {
        return <p>Loading...</p>
    }

    const editValue = (key, value) => {
        dispatch({ type: 'SET_KEY', data: { key, value } })
    }

    const processColumn = (col) => {
        if (col.IS_IDENTITY || col.CONSTRAINT_TYPE === "PRIMARY_KEY") {
            return <p className="form-control-static text-muted font-italic">Identity Key or Primary Key</p>
        }
        switch (col.DATA_TYPE) {
            case 'int':
            case 'bigint':
            case 'tinyint':
                return <input type="number" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, +e.target.value)} className="form-control" step="0" />
            case 'decimal':
                return <input type="number" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, +e.target.value)} className="form-control" />
            case 'nvarchar':
            case 'varchar':
                return <input type="text" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, e.target.value)} className="form-control" placeholder={col.COLUMN_NAME} />
            case 'char':
                return <input type="text" maxLength="1" rows="1" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, e.target.value)} className="form-control w-auto" placeholder={col.COLUMN_NAME} />
            case 'bit':
                return (
                    <div className="checkbox">
                        <input type="checkbox" checked={state.object[col.COLUMN_NAME] || false} onChange={e => editValue(col.COLUMN_NAME, e.target.checked)} />
                    </div>
                )
            case 'date':
            case 'datetime':
            case 'datetime2':
                return <input type="date" value={state.object[col.COLUMN_NAME] || ""} onChange={e => editValue(col.COLUMN_NAME, e.target.value)} className="form-control" />
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
                </div>
            </div>
            <div className="row">
                <div className="col-12 col-sm-6">
                    {columns.map((col, idx) => (
                        <div key={idx} className="form-group">
                            <label>{col.COLUMN_NAME}</label>
                            {processColumn(col)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <p className="alert alert-info">{JSON.stringify(state.object)}</p>
                    <hr />
                    <TableComponent rows={columns} />
                </div>
            </div>
        </div>

    )
}

export default Table