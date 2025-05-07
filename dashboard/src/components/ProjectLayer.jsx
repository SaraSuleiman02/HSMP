import React, { useEffect, useState } from 'react';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { Icon } from '@iconify/react';
import axiosInstance from "../axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import ProjectMoreInfoModal from './modals/ProjectMoreInfoModal';
import ProjectBidsModal from './modals/ProjectBidsModal';
import DeleteModal from './modals/DeleteModal';

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => (
    <input
        className="form-control w-30"
        value={globalFilter || ''}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search Projects ..."
    />
);

const ProjectLayer = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [moreInfoProject, setMoreInfoProject] = useState(null);
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const [projectId, setProjectId] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axiosInstance.get('/project');
            setProjects(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Projects:', error);
            toast.error('Failed to fetch Projects');
            setLoading(false);
        }
    };

    const handleDeleteProject = (project) => {
        setSelectedProject(project);
        setShowDeleteModal(true);
    };

    const handleViewMoreInfo = (project) => {
        setMoreInfoProject(project);
        setShowMoreInfo(true);
    };

    const handleViewBids = (projectId) => {
        setProjectId(projectId);
        setShowBidModal(true);
    }

    const columns = React.useMemo(() => [
        {
            Header: '#',
            accessor: (_row, i) => i + 1,
        },
        {
            Header: 'Home Owner',
            accessor: row => row.homeownerId?.name,
            Cell: ({ value }) => {
                if (!value) return '—';
                return value;
            },
        },
        {
            Header: 'Category',
            accessor: 'category',
        },
        {
            Header: 'Address',
            accessor: 'address',
            Cell: ({ value }) => {
                if (!value) return '—';
                const { city, country } = value;
                return `${city}, ${country}`;
            },
        },
        {
            Header: 'Status',
            accessor: row => row.status,
            Cell: ({ value }) => (
                <span className={`badge ${value === 'Open' ? 'bg-danger' :
                    value === 'In Progress' ? 'bg-secondary' :
                        value === 'Assigned' ? 'bg-success' : 'bg-warning'}`}>
                    {value}
                </span>
            ),
        },
        {
            Header: 'More Info',
            Cell: ({ row }) => (
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleViewMoreInfo(row.original)}
                >
                    View
                </button>
            ),
        },
        {
            Header: 'Bids',
            Cell: ({ row }) => (
                <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleViewBids(row.original._id)}
                >
                    View
                </button>
            ),
        },
        {
            Header: 'Delete',
            Cell: ({ row }) => (
                <div className="text-center">
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteProject(row.original)}
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
    } = useTable({ columns, data: projects }, useGlobalFilter, useSortBy);

    return (
        <div className="card basic-data-table">
            <ToastContainer />
            <div className="card-header">
                <div className="d-flex justify-content-between">
                    <h5 className='card-title mb-0 mt-3'>Projects</h5>

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
                ) : projects.length === 0 ? (
                    <div className="text-center p-4">No projects found</div>
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

            {selectedProject && (
                <DeleteModal
                    show={showDeleteModal}
                    handleClose={() => setShowDeleteModal(false)}
                    id={selectedProject._id}
                    fetchData={fetchProjects}
                    title="Project"
                    route="project"
                />
            )}

            {moreInfoProject && (
                <ProjectMoreInfoModal
                    show={showMoreInfo}
                    project={moreInfoProject}
                    onClose={() => setShowMoreInfo(false)}
                />
            )}

            {projectId && (
                <ProjectBidsModal
                    show={showBidModal}
                    projectId={projectId}
                    onClose={() => setShowBidModal(false)}
                />
            )}

        </div>
    );
};

export default ProjectLayer; 