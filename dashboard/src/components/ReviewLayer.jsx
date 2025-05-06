import React, { useEffect, useState } from 'react';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { Icon } from '@iconify/react';
import axiosInstance from "../axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import DeleteModal from './modals/DeleteModal';

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => (
    <input
        className="form-control w-30"
        value={globalFilter || ''}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search Reviews..."
    />
);

const ReviewLayer = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await axiosInstance.get('/review');
            setReviews(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Reviews:', error);
            toast.error('Failed to fetch Reviews');
            setLoading(false);
        }
    };

    const handleDeleteReview = (review) => {
        setSelectedReview(review);
        setShowDeleteModal(true);
    };

    const columns = React.useMemo(() => [
        {
            Header: '#',
            accessor: (_row, i) => i + 1,
        },
        {
            Header: 'Project Title',
            accessor: row => row.projectId.title,
            Cell: ({ value }) => (
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {value}
                </div>
            ),
        },
        {
            Header: 'Home Owner',
            accessor: row => row.reviewerId.name,
            Cell: ({ value }) => (
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {value}
                </div>
            ),
        },
        {
            Header: 'Professional',
            accessor: row => row.professionalId.name,
            Cell: ({ value }) => (
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {value}
                </div>
            ),
        },
        {
            Header: 'Rating',
            accessor: 'rating',
            Cell: ({ value }) => (
                <div className="text-center">
                    {Array.from({ length: value }, (_, index) => (
                        <Icon key={index} icon="mdi:star" style={{ color: '#FFD700' }} />
                    ))}
                </div>
            ),
        },
        {
            Header: 'Comment',
            accessor: 'comment',
            Cell: ({ value }) => (
                <div style={{ width: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {value}
                </div>
            ),
        },
        {
            Header: 'Delete',
            Cell: ({ row }) => (
                <div className="text-center">
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteReview(row.original)}
                    >
                        <Icon icon="mdi:delete" />
                    </button>
                </div>
            ),
        },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        setGlobalFilter,
        state,
    } = useTable({ columns, data: reviews }, useGlobalFilter, useSortBy);

    return (
        <div className="card basic-data-table">
            <ToastContainer />
            <div className="card-header">
                <div className="d-flex justify-content-between">
                    <h5 className='card-title mb-0 mt-3'>Reviews</h5>

                    <GlobalFilter
                        globalFilter={state.globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        className="w-100 w-md-auto"
                    />
                </div>
            </div>
            <div className="card-body p-0">
                {loading ? (
                    <div className="text-center p-4">Loading...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center p-4">No reviews found</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table bordered-table mb-0" {...getTableProps()}>
                            <thead>
                                {headerGroups.map(headerGroup => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map(column => (
                                            <th {...column.getHeaderProps(column.getSortByToggleProps())} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                {column.render('Header')}
                                                {' '}
                                                {column.isSorted ? (
                                                    column.isSortedDesc ? <FaSortDown /> : <FaSortUp />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.3 }} />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody {...getTableBodyProps()}>
                                {rows.map(row => {
                                    prepareRow(row);
                                    return (
                                        <tr {...row.getRowProps()}>
                                            {row.cells.map(cell => {
                                                const { key, ...cellProps } = cell.getCellProps();
                                                return (
                                                    <td key={key} {...cellProps} style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                        {cell.render('Cell')}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedReview && (
                <DeleteModal
                    show={showDeleteModal}
                    handleClose={() => setShowDeleteModal(false)}
                    id={selectedReview._id}
                    fetchData={fetchReviews}
                    title="Review"
                    route="review"
                />
            )}

        </div>
    );
};

export default ReviewLayer; 