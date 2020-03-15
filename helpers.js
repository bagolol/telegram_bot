const child_process = require('child_process');
const fs = require('fs');
const got = require('got');
const FormData = require('form-data');
const IMAGE_FILE_NAME = `${__dirname}/photos/image.jpg`;
const VIDEO_FILE_NAME_H264 = `${__dirname}/videos/video.h264`;
const VIDEO_FILE_NAME_MP4 = `${__dirname}/videos/video.mp4`;

const takePicture = () => {
    return new Promise((resolve, reject) => {
        const args = ['-w', '320', '-h', '240', '-o', IMAGE_FILE_NAME, '-t', '1'];
        const spawn = child_process.spawn('raspistill', args);
        spawn.on('exit', function(code) {
            resolve(fileName);
        });
    });
};

const takeVideo = (duration) => {
    return new Promise((resolve, reject) => {
        const args = ['-w', '320', '-h', '240', '-o', VIDEO_FILE_NAME_H264, '-t', duration];
        const spawn = child_process.spawn('raspivid', args);
        spawn.on('exit', code => encodeToMp4(fileName).then(file => resolve(file)));
    });
};

function encodeToMp4 (inputFile) {
    clearOldFiles(VIDEO_FILE_NAME_MP4);
    return new Promise((resolve, reject) => {
        const args = [ '-add', inputFile, VIDEO_FILE_NAME_MP4] ;
        const spawn = child_process.spawn('MP4Box', args);
        spawn.on('exit', code => {
            console.log('Encoding Video');
            resolve(outputFile);
        });
    });
}

function clearOldFiles(pathToFile) {
    try {
        fs.unlinkSync(pathToFile);
    } catch(e) {
        console.log('No files to clear', e);
    }
}

async function sendVideoToChat(ctx, duration) {
    try {
        await takeVideo(duration);
        const fileName = `${__dirname}/videos/video.mp4`;
        return ctx.replyWithVideo({source: fileName});
    } catch(e) {
        return ctx.reply('the video could not be taken this time');
    }
}


function postPhoto(chatId, fileName) {
    const ENDPOINT = '';
    const form = new FormData();

    form.append('chat_id', chatId);
    form.append('photo', fs.createReadStream(fileName));

    got.post(`${ENDPOINT}/sendPhoto`, { body: form });
}

module.exports = { takePicture, postPhoto, sendVideoToChat, takeVideo };
