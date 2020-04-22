import React, { useState, useEffect } from 'react'
import TableComponent from './table-component'

const Tables = props => {

    const [tables, setTables] = useState(null)

    useEffect(() => {
        fetch(`http://localhost:3001/tables`)
            .then(res => res.json())
            .then(data => {
                console.log(data)
                setTables(data.data)
            })
    }, [])

    if (!tables) {
        return <p>Loading...</p>
    }



    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col">
                    <h1>Table List</h1>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <TableComponent rows={tables} link="/tables/" linkRow="TABLE_NAME" />
                </div>
            </div>
        </div>
    )
}

export default Tables