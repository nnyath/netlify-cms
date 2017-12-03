import PropTypes from 'prop-types';
import React from 'react';
import Button from 'react-toolbox/lib/button';
import Authenticator from '../../lib/netlify-auth';
import { Icon } from '../../components/UI';
import { Notifs } from 'redux-notifications';
import { Toast } from '../../components/UI/index';
import styles from './AuthenticationPage.css';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,    
  };

  state = {};

  handleLogin = (e) => {
    e.preventDefault();
    const cfg = {
      base_url: this.props.base_url,
      site_id: (document.location.host.split(':')[0] === 'localhost') ? 'cms.netlify.com' : this.props.siteId
    };
    const auth = new Authenticator(cfg);

    auth.authenticate({ provider: 'gitlab', scope: 'repo' }, (err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      this.props.onLogin(data);
    });
  };

  render() {
    const { loginError } = this.state;
    const { inProgress } = this.props;    

    return (
      <section className="nc-gitlabAuthenticationPage-root">
        <Notifs CustomComponent={Toast} />
        {loginError && <p>{loginError}</p>}
        <Button
          className="nc-gitlabAuthenticationPage-button"
          raised
          disabled={inProgress}          
          onClick={this.handleLogin}
        >
          <Icon type="gitlab" /> {inProgress ? "Logging in..." : "Login with GitLab"}
          </Button>
      </section>
    );
  }
}
