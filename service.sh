#!/bin/bash

APP_PATH="app.py"
PID_FILE="app.pid"
LOG_DIR="logs"
SERVICE_LOG="$LOG_DIR/service.log" # Log for the service wrapper itself

# Ensure log directory exists
mkdir -p $LOG_DIR

start() {
    if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE) 2>/dev/null; then
        echo "Application is already running (PID: $(cat $PID_FILE))." | tee -a $SERVICE_LOG
    else
        echo "Starting application..." | tee -a $SERVICE_LOG
        # Redirect stdout/stderr to the service log to capture any direct print statements
        # or errors from Python interpreter itself before Flask's logger takes over.
        # Flask's internal logging already goes to logs/app.log
        nohup python3 $APP_PATH > $SERVICE_LOG 2>&1 &
        echo $! > $PID_FILE
        echo "Application started with PID: $(cat $PID_FILE)" | tee -a $SERVICE_LOG
    fi
}

stop() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping application (PID: $PID)..." | tee -a $SERVICE_LOG
            kill $PID
            # Give it a moment to terminate gracefully
            sleep 2
            if kill -0 $PID 2>/dev/null; then
                echo "Application did not terminate gracefully, sending KILL signal." | tee -a $SERVICE_LOG
                kill -9 $PID
            fi
            rm $PID_FILE
            echo "Application stopped." | tee -a $SERVICE_LOG
        else
            echo "PID file exists, but application not running. Cleaning up PID file." | tee -a $SERVICE_LOG
            rm $PID_FILE
        fi
    else
        echo "Application is not running." | tee -a $SERVICE_LOG
    fi
}

restart() {
    echo "Restarting application..." | tee -a $SERVICE_LOG
    stop
    start
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        if [ -f $PID_FILE ]; then
            PID=$(cat $PID_FILE)
            if kill -0 $PID 2>/dev/null; then
                echo "Application is running with PID: $PID"
            else
                echo "Application is not running, but PID file exists. Cleaning up."
                rm $PID_FILE
            fi
        else
            echo "Application is not running."
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
esac

exit 0
