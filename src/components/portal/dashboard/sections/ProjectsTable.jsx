import React from 'react';

function ProjectsTable() {

    return () => {
        <div className="projects-section">
            <div className="projects-table">
                <div className="card-header">
                    <div className="card-title">💼 Latest Projects</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>PROJECT NAME</th>
                            <th>STATUS</th>
                            <th>EXPECTED ROI (%)</th>
                            <th>TARGET INVESTMENT</th>
                            <th>PAYBACK PERIOD</th>
                            <th>START DATE</th>
                            <th>END DATE</th>
                            <th>EXPECTED GENERATION</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#SF1201</td>
                            <td>Solar Farm A</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>20%</td>
                            <td>₫150,000,000</td>
                            <td>5</td>
                            <td>2024-06-01</td>
                            <td>2024-06-15</td>
                            <td>1,200,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#GP2305</td>
                            <td>GreenRay Plant</td>
                            <td><span className="status-badge status-installation">Under Installation</span></td>
                            <td>22%</td>
                            <td>₫210,000,000</td>
                            <td>4.8</td>
                            <td>2024-07-01</td>
                            <td>2024-07-20</td>
                            <td>1,450,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#SB1120</td>
                            <td>SunBeam Project</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>21%</td>
                            <td>₫175,000,000</td>
                            <td>5.2</td>
                            <td>2024-07-10</td>
                            <td>2024-08-01</td>
                            <td>1,320,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#HG0987</td>
                            <td>HelioGrid</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>23%</td>
                            <td>₫240,000,000</td>
                            <td>4.5</td>
                            <td>2024-06-05</td>
                            <td>2024-06-25</td>
                            <td>1,600,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#NS5678</td>
                            <td>Nova Solar Park</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>25%</td>
                            <td>₫280,000,000</td>
                            <td>4</td>
                            <td>2024-07-18</td>
                            <td>2024-08-05</td>
                            <td>1,850,000</td>
                            <td>...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    }
}

export default ProjectsTable;