(function () {
    window.onerror = function (message, source, lineno, colno, error) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.background = 'red';
        div.style.color = 'white';
        div.style.padding = '10px';
        div.style.zIndex = '9999';
        div.textContent = `Error: ${message} at ${source}:${lineno}:${colno}`;
        document.body.prepend(div);
        console.error(message, source, lineno, colno, error);
    };

    window.addEventListener('unhandledrejection', function (event) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '50px';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.background = 'orange';
        div.style.color = 'black';
        div.style.padding = '10px';
        div.style.zIndex = '9999';
        div.textContent = `Unhandled Promise Rejection: ${event.reason}`;
        document.body.prepend(div);
        console.error('Unhandled rejection', event.reason);
    });
})();
