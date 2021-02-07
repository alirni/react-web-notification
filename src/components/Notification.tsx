import React, {useState, useRef, useEffect} from 'react';
import { bool, func, number, object, string } from 'prop-types';

const PERMISSION_GRANTED = 'granted';
const PERMISSION_DENIED = 'denied';

const seqGen = () => {
  let i = 0;
  return () => {
    return i++;
  };
};
const seq = seqGen();

// https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API
// https://github.com/mobilusoss/react-web-notification/issues/66
export const checkNotificationPromise = function() {
  try {
    window.Notification.requestPermission().then();
  } catch(e) {
    return false;
  }
  return true;
}
const Notification = (props) => {
  const {notSupported, disableActiveWindow, onPermissionGranted, askAgain, onPermissionDenied, options, swRegistration, onClick,
onClose,
onError, title, timeout, onShow, ignore} = props;

  const [supported, setSupported] = useState(('Notification' in window) && window.Notification ? true : false)
  const [granted, setGranted] = useState(('Notification' in window) && window.Notification && window.Notification.permission === PERMISSION_GRANTED ? true : false)
  const notifications = useRef({})
  const windowFocus = useRef(true)

  const onWindowFocus = () => {
    windowFocus.corrent = true;
  }

  const onWindowBlur = () => {
    windowFocus.corrent = false;
  }

  const _askPermission = () => {
    const handlePermission = (permission) => {
      setGranted(permission === PERMISSION_GRANTED)
    }

    if (checkNotificationPromise()) {
      window.Notification.requestPermission()
      .then((permission) => {
        handlePermission(permission);
      })
    } else {
      window.Notification.requestPermission((permission) => {
        handlePermission(permission);
      });
    }
  }

  useEffect(() => {
    if (granted) {
          onPermissionGranted();
        } else {
          onPermissionDenied();
        }
  }, [granted])

  useEffect(() => {
    if (disableActiveWindow) {
      window.addEventListener('focus', onWindowFocus);
      window.addEventListener('blur', onWindowBlur);
    }

    if (!supported) {
      notSupported();
    } else if (granted) {
      onPermissionGranted();
    } else {
      if (window.Notification.permission === PERMISSION_DENIED){
        if (askAgain){
          _askPermission();
        } else {
          onPermissionDenied();
        }
      } else {
        _askPermission();
      }
    }
    return () => {
      if (disableActiveWindow) {
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('blur', onWindowBlur);
    }
    }
  }, [])

  const doNotification = () => {
    let opt = options;
    if (typeof opt.tag !== 'string') {
      opt.tag = 'web-notification-' + seq();
    }
    if (notifications[opt.tag]) {
      return;
    }

    if (swRegistration && swRegistration.showNotification) {
      swRegistration.showNotification(title, opt)
      notifications[opt.tag] = {};
    } else {
      const n = new window.Notification(title, opt);
      n.onshow = e => {
        onShow(e, opt.tag);
        if (timeout > 0) {
          setTimeout(() => {
            close(n);
          }, timeout);
        }
      };
      n.onclick = e => { onClick(e, opt.tag); };
      n.onclose = e => { onClose(e, opt.tag); };
      n.onerror = e => { onError(e, opt.tag); };

      notifications[opt.tag] = n;
    }
  }

    

  const close = (n) => {
    if (n && typeof n.close === 'function') {
      n.close();
    }
  }

  // for debug
  const _getNotificationInstance= (tag)=> {
    return notifications[tag];
  }

  let doNotShowOnActiveWindow = disableActiveWindow && windowFocus.corrent;
    if (!ignore && title && supported && granted && !doNotShowOnActiveWindow) {
      doNotification();
    }

    // return null cause
    // Error: Invariant Violation: Notification.render(): A valid ReactComponent must be returned. You may have returned undefined, an array or some other invalid object.
    return (
      <input type='hidden' name='dummy-for-react-web-notification' style={{display: 'none'}} />
    );
}

Notification.propTypes = {
  ignore: bool,
  disableActiveWindow: bool,
  askAgain: bool,
  notSupported: func,
  onPermissionGranted: func,
  onPermissionDenied: func,
  onShow: func,
  onClick: func,
  onClose: func,
  onError: func,
  timeout: number,
  title: string.isRequired,
  options: object,
  swRegistration: object,
};

Notification.defaultProps = {
  ignore: false,
  disableActiveWindow: false,
  askAgain: false,
  notSupported: () => {},
  onPermissionGranted: () => {},
  onPermissionDenied: () => {},
  onShow: () => {},
  onClick: () => {},
  onClose: () => {},
  onError: () => {},
  timeout: 5000,
  options: {},
  swRegistration: null,
};

export default Notification;
