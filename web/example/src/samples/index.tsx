import * as React from "react";
import { Link } from "react-router-dom";

export const SampleList = () => {
    return (
        <div>
            <header>Sample list</header>
            <div>
                <div>
                    <Link to="echo-pair">Echo ConsumerPair</Link>
                </div>
                <div>
                    <Link to="conference">Conference</Link>
                </div>
            </div>
        </div>
    )
}