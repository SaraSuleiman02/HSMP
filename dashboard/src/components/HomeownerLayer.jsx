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
        placeholder="Search Home Owners..."
    />
);

const HomeownerLayer = () => {
    const [homeOwners, setHomeOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState(null);

    useEffect(() => {
        fetchHomeOwners();
    }, []);

    const fetchHomeOwners = async () => {
        try {
            const response = await axiosInstance.get('/user');
            const homeownersOnly = response.data.filter(user => user.role === 'homeowner');
            setHomeOwners(homeownersOnly);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Home Owners:', error);
            toast.error('Failed to fetch Home Owners');
            setLoading(false);
        }
    };

    const handleDeleteOwner = (homeOwner) => {
        setSelectedOwner(homeOwner);
        setShowDeleteModal(true);
    };

    const columns = React.useMemo(() => [
        {
            Header: '#',
            accessor: (_row, i) => i + 1,
        },
        {
            Header: 'Photo',
            accessor: 'profilePictureUrl',
            Cell: ({ value }) => (
                <img
                    src={value}
                    alt="Profile"
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
            ),
        },
        {
            Header: 'Name',
            accessor: 'name',
        },
        {
            Header: 'Email',
            accessor: 'email',
        },
        {
            Header: 'Phone',
            accessor: 'phone',
        },
        {
            Header: 'Address',
            accessor: 'address',
            Cell: ({ value }) => {
                if (!value) return '—';
                const { street, city} = value;
                return `${street}, ${city}`;
            },
        },
        {
            Header: 'Last Login',
            accessor: 'lastLogin',
            Cell: ({ value }) => {
                if (!value) return '—';
                return new Date(value).toLocaleDateString()
            },
        },
        {
            Header: 'Delete',
            Cell: ({ row }) => (
                <div className="text-center">
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteOwner(row.original)}
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
    } = useTable({ columns, data: homeOwners }, useGlobalFilter, useSortBy);

    return (
        <div className="card basic-data-table">
            <ToastContainer />
            <div className="card-header">
                <div className="d-flex justify-content-between">
                    <h5 className='card-title mb-0 mt-3'>Home Owners</h5>

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
                ) : homeOwners.length === 0 ? (
                    <div className="text-center p-4">No homeOwners found</div>
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

            {selectedOwner && (
                <DeleteModal
                    show={showDeleteModal}
                    handleClose={() => setShowDeleteModal(false)}
                    id={selectedOwner._id}
                    fetchData={fetchHomeOwners}
                    title="Home Owner"
                    route="user"
                />
            )}

        </div>
    );
};

export default HomeownerLayer; 