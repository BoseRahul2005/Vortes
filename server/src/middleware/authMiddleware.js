const { getAuth } = require('@clerk/express');

const protectRoute = (req, res, next) => {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please sign in.',
        });
    }

    next();
};

module.exports= {protectRoute};