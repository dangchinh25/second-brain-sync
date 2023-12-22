import express, { Request, Response } from 'express';
import fs from 'fs';
import { env } from '../config';

export const app = express();
app.use( express.json() );


app.get( '/oauth2callback', async ( req: Request, res: Response ) => {
    const { code } = req.query;

    const tokenCodePayload = { tokenCode: code };

    fs.writeFile( env.TOKEN_CODE_PATH, JSON.stringify( tokenCodePayload ), err => {
        if ( err ) {
            console.error( err );
        }
    } );

    return res.status( 200 ).json( {} );
} );