import React, { useEffect, useState } from 'react';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { Icon } from '@iconify/react';
import axiosInstance from "../axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import ProfileModal from './modals/ProfileModal';
import DeleteModal from './modals/DeleteModal';

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => (
    <input
        className="form-control w-30"
        value={globalFilter || ''}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search Professionals ..."
    />
);

const ProfessionalLayer = () => {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profileId, setProfileId] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState(null);

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async () => {
        try {
            const response = await axiosInstance.get('/user');
            const professionalsOnly = response.data.filter(user => user.role === 'professional');
            setProfessionals(professionalsOnly);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Professionals:', error);
            toast.error('Failed to fetch Professionals');
            setLoading(false);
        }
    };

    const handleDeleteProfessional = (homeOwner) => {
        setSelectedProfessional(homeOwner);
        setShowDeleteModal(true);
    };

    const handleToggleActivation = async (userId) => {
        try {
            const res = await axiosInstance.put(`/user/activate/${userId}`);
            toast.success(res.data.message);
            fetchProfessionals();
        } catch (error) {
            console.error('Error toggling activation:', error);
            toast.error('Error togglig the activation!');
        }
    };

    const handleViewProfile = (profileId) => {
        setProfileId(profileId);
        setShowProfileModal(true);
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
                const { street, city } = value;
                return `${street}, ${city}`;
            },
        },
        {
            Header: 'Activation Status',
            accessor: row => row.isActive,
            Cell: ({ value, row }) => {
                const userId = row.original._id;

                return (
                    <div className="dropdown">
                        <span
                            className={`badge ${value ? 'bg-success' : 'bg-danger'} dropdown-toggle`}
                            data-bs-toggle="dropdown"
                            role="button"
                            style={{ cursor: 'pointer' }}
                        >
                            {value ? 'Active' : 'Not Active'}
                        </span>
                        <ul className="dropdown-menu">
                            <li>
                                <button className="dropdown-item" onClick={() => handleToggleActivation(userId)}>
                                    {value ? 'Deactivate' : 'Activate'}
                                </button>
                            </li>
                        </ul>
                    </div>
                );
            }
        },
        {
            Header: 'Profile',
            accessor: row => row.professionalProfileId,
            Cell: ({ value }) => {
                if (!value) return '—';

                return (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewProfile(value)}
                    >
                        View
                    </button>
                );
            }
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
                        onClick={() => handleDeleteProfessional(row.original)}
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
    } = useTable({ columns, data: professionals }, useGlobalFilter, useSortBy);

    return (
        <div className="card basic-data-table">
            <ToastContainer />
            <div className="card-header">
                <div className="d-flex justify-content-between">
                    <h5 className='card-title mb-0 mt-3'>Professionals</h5>

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
                ) : professionals.length === 0 ? (
                    <div className="text-center p-4">No professionals found</div>
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

            {selectedProfessional && (
                <DeleteModal
                    show={showDeleteModal}
                    handleClose={() => setShowDeleteModal(false)}
                    id={selectedProfessional._id}
                    fetchData={fetchProfessionals}
                    title="Professional"
                    route="user"
                />
            )}

            {profileId && (
                <ProfileModal
                    show={showProfileModal}
                    profileId={profileId}
                    onClose={() => setShowProfileModal(false)}
                />
            )}

        </div>
    );
};

export default ProfessionalLayer; 