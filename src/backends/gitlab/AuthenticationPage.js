import React from 'react';
import Button from 'react-toolbox/lib/button';
import Authenticator from '../../lib/netlify-auth';
import { Icon } from '../../components/UI';
import { Notifs } from 'redux-notifications';
import { Toast } from '../../components/UI/index';
import styles from './AuthenticationPage.css';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired,
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

    return (
      <section className={styles.root}>
        <Notifs CustomComponent={Toast} />
        {loginError && <p>{loginError}</p>}
        <Button
          className={styles.button}
          raised
          onClick={this.handleLogin}
        >
          Login with GitLab
        </Button>
      </section>
    );
  }
}
