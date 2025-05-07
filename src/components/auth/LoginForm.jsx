import React, { useState } from 'react';
import { login } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            if (response.token) {
                // Verify token was stored
                const storedToken = localStorage.getItem('token');
                console.log('Token stored after login:', storedToken);
                
                // Update auth context
                login(response);
                navigate('/admin');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div>
            {/* Render your form here */}
        </div>
    );
};

export default LoginForm; 