import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from './containers/app';
import Login from './containers/auth/login';
import Live from './containers/live';
import RequireAuth from './containers/auth/require_auth';


export default (
    <Route path="/" component={App} >
        <IndexRoute to="/" component={Login} />
        <Route path="/live" component={RequireAuth(Live)} />
    </Route>
);