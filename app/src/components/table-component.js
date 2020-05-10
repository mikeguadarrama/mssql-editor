import React from 'react'
import { Link } from 'react-router-dom'

const TableComponent = props => {

    const { rows, link, linkRow } = props

    if (!rows) {
        return <p>Loading table...</p>
    }

    const columns = Object.keys(rows[0])

    return (
        <div className="table-responsive mb-4">
            <table className="table table-striped table-bordered w-auto">
                <thead className="bg-light">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx}>{col}</th>
                        ))}
                        {link && (
                            <th>Link</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            {columns.map((col, idx2) => (
                                <td key={idx2}>{row[col]}</td>
                            ))}
                            {link && (
                                <td>
                                    <Link to={`/table/${row[linkRow]}`}>Link</Link>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TableComponent