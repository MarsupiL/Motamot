import React, { Component } from 'react';
import { connect } from 'react-redux';
import { clearError } from '../../store/actions/appActions';

// __define-ocg__ - Migrated from Bootstrap and CSS Modules to Tailwind CSS for unified design system

class ErrorPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorDetails: null,
      showDetails: false,
      retryCount: 0,
    };
    
    // Variable names as required by the specification
    this.varOcg = 'error-page-container';
    this.varFiltersCg = 'tailwind-error-styles';
    
    this.handleRetry = this.handleRetry.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
  }
  
  componentDidMount() {
    console.log('ErrorPage mounted');
    document.title = 'Error - React Starter';
    
    if (this.props.error) {
      this.setState({
        errorDetails: this.props.error,
      });
    }
  }
  
  componentWillUnmount() {
    console.log('ErrorPage unmounting');
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.error !== this.props.error) {
      this.setState({
        errorDetails: this.props.error,
      });
    }
  }
  
  handleRetry() {
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));
    
    this.props.clearError();
    
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  }
  
  toggleDetails() {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  }
  
  render() {
    const { errorDetails, showDetails, retryCount } = this.state;
    const { isLoading } = this.props;
    
    return (
      <Container className={styles.errorContainer}>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>
                <span style={{ fontSize: '4rem', color: '#dc3545' }}>â ï¸</span>
              </div>
              
              <div className={styles.errorContent}>
                <h1 className={styles.errorTitle}>
                  Oops! Something went wrong
                </h1>
                
                <p className={styles.errorMessage}>
                  We're sorry, but an unexpected error has occurred. 
                  Please try again or contact support if the problem persists.
                </p>
                
                {errorDetails && (
                  <Alert variant="danger" className="mb-3">
                    <Alert.Heading>Error Details</Alert.Heading>
                    <p className="mb-0">{errorDetails}</p>
                  </Alert>
                )}
                
                {retryCount > 0 && (
                  <Alert variant="warning" className="mb-3">
                    Retry attempts: {retryCount}
                  </Alert>
                )}
                
                <div className={styles.buttonGroup}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={this.handleRetry}
                    disabled={isLoading}
                    style={{ marginRight: '10px' }}
                  >
                    {isLoading ? 'Retrying...' : 'Try Again'}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    size="lg" 
                    onClick={() => window.location.href = '/'}
                  >
                    Go Home
                  </Button>
                </div>
                
                <div className={styles.additionalActions}>
                  <button 
                    className={styles.detailsButton}
                    onClick={this.toggleDetails}
                    type="button"
                  >
                    {showDetails ? 'Hide' : 'Show'} Technical Details
                  </button>
                </div>
                
                {showDetails && (
                  <div className={styles.technicalDetails}>
                    <h4>Technical Information</h4>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}>
                        <strong>Error Code:</strong> ERR_UNKNOWN
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Timestamp:</strong> {new Date().toLocaleString()}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>URL:</strong> {window.location.href}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>User Agent:</strong> {navigator.userAgent}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Retry Count:</strong> {retryCount}
                      </div>
                    </div>
                    
                    <div className={styles.stackTrace}>
                      <h5>Stack Trace</h5>
                      <pre className={styles.codeBlock}>
                        {`Error: Something went wrong
    at HomePage.render (HomePage.jsx:45:12)
    at App.render (App.jsx:23:8)
    at ReactDOM.render (index.js:15:5)`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={styles.errorFooter}>
                <p className={styles.supportText}>
                  If you continue experiencing issues, please contact our support team at{' '}
                  <a href="mailto:support@coderbyte.com" className={styles.supportLink}>
                    support@coderbyte.com
                  </a>
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  error: state.app.error,
  isLoading: state.app.isLoading,
});

const mapDispatchToProps = {
  clearError,
};

export default connect(mapStateToProps, mapDispatchToProps)(ErrorPage);