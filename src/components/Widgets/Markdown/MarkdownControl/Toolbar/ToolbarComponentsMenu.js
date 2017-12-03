import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Menu, MenuItem } from 'react-toolbox/lib/menu';
import ToolbarButton from './ToolbarButton';

export default class ToolbarComponentsMenu extends React.Component {
  static PropTypes = {
    plugins: ImmutablePropTypes.map,
    onComponentMenuItemClick: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      componentsMenuActive: false,
    };
  }

  handleComponentsMenuToggle = () => {
    this.setState({ componentsMenuActive: !this.state.componentsMenuActive });
  };

  handleComponentsMenuHide = () => {
    this.setState({ componentsMenuActive: false });
  };

  render() {
    const { plugins, onComponentMenuItemClick, disabled } = this.props;
    return (
      <div className="nc-toolbarComponentsMenu-root">
        <ToolbarButton
          label="Add Component"
          icon="plus"
          action={this.handleComponentsMenuToggle}
          disabled={disabled}
        />
        <Menu
          active={this.state.componentsMenuActive}
          position="auto"
          onHide={this.handleComponentsMenuHide}
          ripple={false}
        >
          {plugins && plugins.toList().map(plugin => (
            <MenuItem
              key={plugin.get('id')}
              value={plugin.get('id')}
              caption={plugin.get('label')}
              onClick={() => onComponentMenuItemClick(plugin)}
              className="nc-toolbarComponentsMenu-menuItem"
            />
          ))}
        </Menu>
      </div>
    );
  }
}
