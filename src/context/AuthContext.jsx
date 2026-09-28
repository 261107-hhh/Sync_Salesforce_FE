import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [defaultOrgId, setDefaultOrgId] = useState(localStorage.getItem('defaultOrgId') || null);
  const [activeOrgId, setActiveOrgId] = useState(localStorage.getItem('activeOrgId') || null);
  const [activeOrgName, setActiveOrgName] = useState(localStorage.getItem('activeOrgName') || null);
  const [activeOrgRole, setActiveOrgRole] = useState(localStorage.getItem('activeOrgRole') || 'MEMBER');
  const [organizations, setOrganizations] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session state on startup and token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (activeOrgId) {
        localStorage.setItem('activeOrgId', activeOrgId);
      }
      if (defaultOrgId) {
        localStorage.setItem('defaultOrgId', defaultOrgId);
      }
      fetchCurrentUser();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('activeOrgId');
      localStorage.removeItem('activeOrgName');
      localStorage.removeItem('activeOrgRole');
      setUser(null);
      setOrganizations([]);
      setActiveOrgId(null);
      setActiveOrgName(null);
      setActiveOrgRole('MEMBER');
      setLoading(false);
    }
  }, [token]);

  // Listen to 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/users/me');
      if (res.data.success && res.data.data) {
        const u = res.data.data;
        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          createdAt: u.createdAt,
          defaultOrganizationId: u.defaultOrganizationId
        });

        if (u.defaultOrganizationId) {
          setDefaultOrgId(u.defaultOrganizationId);
          localStorage.setItem('defaultOrgId', u.defaultOrganizationId);
        }

        if (Array.isArray(u.organizations) && u.organizations.length > 0) {
          setOrganizations(u.organizations);

          // Determine active organization:
          // User preference: defaultOrganizationId takes highest priority on return/startup
          const storedActive = localStorage.getItem('activeOrgId') || activeOrgId;
          const preferredId = (storedActive && u.organizations.some(o => o.id === storedActive))
            ? storedActive
            : (u.defaultOrganizationId || u.activeOrganizationId || u.organizations[0].id);
          const currentOrg = u.organizations.find(o => o.id === preferredId) || u.organizations[0];

          setActiveOrgId(currentOrg.id);
          setActiveOrgName(currentOrg.name);
          setActiveOrgRole(currentOrg.role || 'MEMBER');

          localStorage.setItem('activeOrgId', currentOrg.id);
          localStorage.setItem('activeOrgName', currentOrg.name);
          localStorage.setItem('activeOrgRole', currentOrg.role || 'MEMBER');
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn('Session expired or invalid token');
        logout();
      } else {
        console.warn('Could not refresh user profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (data) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }

    const defId = data.defaultOrgId || data.defaultOrganizationId;
    if (defId) {
      setDefaultOrgId(defId);
      localStorage.setItem('defaultOrgId', defId);
    }

    if (data.activeOrgId) {
      localStorage.setItem('activeOrgId', data.activeOrgId);
      setActiveOrgId(data.activeOrgId);
    }

    if (data.activeOrgName) {
      localStorage.setItem('activeOrgName', data.activeOrgName);
      setActiveOrgName(data.activeOrgName);
    }

    if (data.activeOrgRole) {
      localStorage.setItem('activeOrgRole', data.activeOrgRole);
      setActiveOrgRole(data.activeOrgRole);
    }

    if (Array.isArray(data.organizations)) {
      setOrganizations(data.organizations);
      if (!data.activeOrgId && data.organizations.length > 0) {
        const preferredId = defId || localStorage.getItem('defaultOrgId');
        const chosen = data.organizations.find(o => o.id === preferredId) || data.organizations[0];
        setActiveOrgId(chosen.id);
        setActiveOrgName(chosen.name);
        setActiveOrgRole(chosen.role || 'MEMBER');
        localStorage.setItem('activeOrgId', chosen.id);
        localStorage.setItem('activeOrgName', chosen.name);
        localStorage.setItem('activeOrgRole', chosen.role || 'MEMBER');
      }
    }

    setUser({
      id: data.id,
      email: data.email,
      name: data.name,
      defaultOrganizationId: defId
    });
  };

  const setDefaultWorkspace = async (organizationId) => {
    try {
      setDefaultOrgId(organizationId);
      localStorage.setItem('defaultOrgId', organizationId);
      const res = await api.post('/api/users/default-org', { organizationId });
      if (res.data?.success) {
        await fetchCurrentUser();
        return { success: true };
      }
      return { success: false, message: res.data?.error || 'Failed to update default workspace' };
    } catch (err) {
      console.warn('Set default workspace API error:', err);
      return { success: true };
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/users/login', { email, password });
    if (res.data.success) {
      handleAuthSuccess(res.data);
      return { success: true };
    }
    return { success: false, message: res.data.message || res.data.error || 'Authentication failed' };
  };

  const register = async (email, password, name) => {
    const res = await api.post('/api/users/register', { email, password, name });
    if (res.data.success) {
      handleAuthSuccess(res.data);
      return { success: true };
    }
    return { success: false, message: res.data.message || res.data.error || 'Registration failed' };
  };

  const registerOrg = async ({ organizationName, slug, adminName, adminEmail, adminPassword }) => {
    const res = await api.post('/api/orgs/register', {
      organizationName,
      slug,
      adminName,
      adminEmail,
      adminPassword
    });
    if (res.data.success) {
      handleAuthSuccess(res.data);
      return { success: true };
    }
    return { success: false, message: res.data.message || res.data.error || 'Organization registration failed' };
  };

  const switchOrg = async (organizationId) => {
    try {
      const res = await api.post('/api/orgs/switch', { organizationId });
      if (res.data.success) {
        handleAuthSuccess(res.data);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Could not switch organization' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || err.response?.data?.message || err.message
      };
    }
  };

  const createOrg = async ({ name, slug }) => {
    try {
      const res = await api.post('/api/orgs', { name, slug });
      if (res.data.success && res.data.data) {
        const newOrg = res.data.data;
        await fetchMyOrgs();
        await switchOrg(newOrg.id);
        return { success: true, data: newOrg };
      }
      return { success: false, message: res.data.message || 'Failed to create organization' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || err.response?.data?.message || err.message
      };
    }
  };

  const fetchMyOrgs = async () => {
    try {
      const res = await api.get('/api/orgs/my-orgs');
      if (res.data.success && Array.isArray(res.data.data)) {
        setOrganizations(res.data.data);
        const current = res.data.data.find(o => o.id === activeOrgId);
        if (current) {
          setActiveOrgName(current.name);
          setActiveOrgRole(current.role || 'MEMBER');
          localStorage.setItem('activeOrgName', current.name);
          localStorage.setItem('activeOrgRole', current.role || 'MEMBER');
        }
        return res.data.data;
      }
    } catch (err) {
      console.warn('Failed to load my-orgs:', err);
    }
    return [];
  };

  const acceptInvitation = async (token, name, password) => {
    try {
      const res = await api.post('/api/orgs/invitations/accept', { token, name, password });
      if (res.data.success) {
        handleAuthSuccess(res.data);
        return { success: true, data: res.data };
      }
      return { success: false, message: res.data.message || 'Invitation acceptance failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || err.response?.data?.message || err.message
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setActiveOrgId(null);
    setActiveOrgName(null);
    setActiveOrgRole('MEMBER');
    localStorage.removeItem('token');
    localStorage.removeItem('activeOrgId');
    localStorage.removeItem('activeOrgName');
    localStorage.removeItem('activeOrgRole');
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      defaultOrgId,
      activeOrgId,
      activeOrgName,
      activeOrgRole,
      organizations,
      login,
      register,
      registerOrg,
      switchOrg,
      createOrg,
      fetchMyOrgs,
      acceptInvitation,
      setDefaultWorkspace,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
