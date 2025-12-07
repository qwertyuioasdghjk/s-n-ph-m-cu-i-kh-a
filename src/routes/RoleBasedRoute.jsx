    import { Navigate } from 'react-router-dom';
    import useUser  from '../hooks/useUser';

    const RoleBasedRoute = ({ children, allowedRoles }) => {
    const { currentUser } = useUser();

 
    return children;
    };

    export default RoleBasedRoute;
