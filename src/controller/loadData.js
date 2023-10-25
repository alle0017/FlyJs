export var Load;
(function (Load) {
    async function image(path) {
        const img = new Image();
        img.src = path;
        return new Promise((resolve, reject) => {
            img.onload = () => {
                resolve(img);
            };
            img.onerror = () => reject();
        });
    }
    Load.image = image;
})(Load || (Load = {}));
