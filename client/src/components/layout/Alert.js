import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux';

const Alert = ({ alerts }) =>
   alerts !== null && alerts.length > 0 &&   // the alerts need to be not null, and the array needs to have at least one element, then ...  (here '&& &&' function as if-then)
   alerts.map(alert => (<div key={alert.id} className={`alert alert-${alert.alertType}`}> {alert.msg} </div>));
// alert.alertType will become something like 'alert-danger' className. 'map' is to iterate through each element in the array.

Alert.propTypes = {
   alerts: PropTypes.array.isRequired
};

const mapStateToProps = state => ({
   alerts: state.alert   // to get the state inside of 'alert' from root reducer, now we have props.alerts
});

export default connect(mapStateToProps)(Alert);
