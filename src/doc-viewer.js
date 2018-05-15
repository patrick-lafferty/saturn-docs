/*
Copyright (c) 2018, Patrick Lafferty
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the copyright holder nor the names of its 
      contributors may be used to endorse or promote products derived from 
      this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR 
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
import React, {Component} from 'react';
import style from './saturn.css';

class Function extends Component {
    constructor(props) {
        super(props);

        this.name = props.name;
        this.signature = props.signature;
        this.description = props.description;
    }

    render() {
        return (
            <li>
                <section className={`code`}>
                    <div className={`function`}>
                        <p className={`functionName darkBlue`}>
                            {this.name}
                        </p>
                        <p className={`functionSignature`}>
                            {this.signature}
                        </p>
                    </div>

                    <p>{this.description}</p>
                </section>
            </li>
        );
    }
}

class Class extends Component {
    render() {
        return (
            <section className={`class`}>
                <h1 className={`className blueBorderBottom`}>{this.props.data.name}</h1>

                {this.props.data.classComment && 
                    <p>{this.props.data.classComment}</p>
                }

                <section>
                    <p className={`classMethods`}>Public Methods</p>

                    <ul>
                        {this.props.data.publicMethods.map(f =>
                            <Function key={f.signature} name={f.name} signature={f.signature} description={f.description} />
                        )}

                    </ul>

                </section>

            </section>
        );
    }
}

class File extends Component {
    
    render() {
        return (
            <section className={`file`}>
                {this.props.classes.length > 0 &&

                <section>
                    <h1 className={`noMargin blueBorderBottom`}>Classes</h1>

                    <ul className={`noPadding`}>
                        {this.props.classes.map(c =>
                            <Class key={c.name} data={c} />
                        )}
                    </ul>

                </section>
                }

                {this.props.functions.length > 0 &&
                <section>
                    <h1 className={`noMargin blueBorderBottom`}>Free Functions</h1>

                    <ul>
                        {this.props.functions.map((f) => 
                        <Function key={f.signature} name={f.name} signature={f.signature} description={f.description} />)}
                    </ul>

                </section>
                }
            </section>
        );
    }
}

class Directory extends Component {

    constructor(props) {
        super(props);
        this.callSelect = (file, index) => {
            this.props.select(file, index);
        };
    }

    render() {
        return (
            <ul className={`directoryContents`}>
                {this.props.files.map((file, index) => 
                    <div key={index} className={`searchResult directoryChild`} onClick={this.callSelect.bind(this, file, index)}>
                        <div className={`resultType ${file.classType}`}></div>
                        <p>{file.name}</p>
                    </div>
                )} 
            </ul>
        );
    }
}

/*
Can be a directory, file, or a class
*/
class ListItem extends Component {

    render() {
        return (
            <div className={`searchResult`}>
                <span className={`resultType ${this.props.item.classType}`}>
                    {this.props.item.type}</span> 
                    {this.props.item.name}
            </div>
        );
    }

}

class Renderable extends Component {

    render() {

        switch (this.props.item.type) {
            case 'file': {
                return <File classes={this.props.item.contents.classes} 
                    functions={this.props.item.contents.freeFunctions} />;
                break;
            }
            case 'dir': {
                return <Directory files={this.props.item.contents} select={this.props.select}/>;
                break;
            }
        }

    }
}

/*
from MDN
*/
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

let names = [];

for (let i = 200; i > 0; i--) {
    names.push(i.toString());
}

function getName() {
    return names.pop();
}

function createDummySig(name) {
    let types = ["int", "void", "float"];

    return types[getRandomInt(0, 3)] + " " + name + "()";
}

function createDummyFile() {

    let name = getName();

    let file = {type: 'file', classType: 'fileType', name: 'text.h', contents: {classes: [{name: 'FaceCache', classComment: '', publicMethods: [{name: 'addCache', signature: '(int, Apollo::Text::Style, uint32_t) -> void', description: ''}, {name: 'getGlyphCache', signature: '(Apollo::Text::Style, uint32_t) -> std::optional<Cache *>', description: ''}]}, {name: 'Renderer', classComment: '    Renderer handles the layout, positioning and rendering of text    into a window\'s framebuffer    ', publicMethods: [{name: 'drawText', signature: '(const Apollo::Text::TextLayout &, const Apollo::Elements::Bounds &, const Apollo::Elements::Bounds &, uint32_t) -> void', description: '        Renders a prepared text layout to the stored window\'s framebuffer,        with alpha blending.        '}, {name: 'layoutText', signature: '(const char *, uint32_t, uint32_t, Apollo::Text::Style, bool, uint32_t) -> Apollo::Text::TextLayout', description: '        Prepares each glyph\'s bitmap with FreeType, positions each        glyph with optional kerning, and applies line wrapping.        Allows the use of ANSI escape sequences in text to change        the colour of glyphs.        '}]}], freeFunctions: [{name: 'createRenderer', signature: '(Apollo::Window *) -> Apollo::Text::Renderer *', description: ''}]}};

    let file2 = {
        type: "file",
        classType: "fileType",
        name: name + ".cpp",

        contents: {
            classes: [
                {name: 'FaceCache', classComment: '', publicMethods: [{name: 'addCache', signature: '(int, Apollo::Text::Style, uint32_t) -> void', description: ''}, {name: 'getGlyphCache', signature: '(Apollo::Text::Style, uint32_t) -> std::optional<Cache *>', description: ''}]}, {name: 'Renderer', classComment: '    Renderer handles the layout, positioning and rendering of text    into a window\'s framebuffer    ', publicMethods: [{name: 'drawText', signature: '(const Apollo::Text::TextLayout &, const Apollo::Elements::Bounds &, const Apollo::Elements::Bounds &, uint32_t) -> void', description: '        Renders a prepared text layout to the stored window\'s framebuffer,        with alpha blending.        '}, {name: 'layoutText', signature: '(const char *, uint32_t, uint32_t, Apollo::Text::Style, bool, uint32_t) -> Apollo::Text::TextLayout', description: '        Prepares each glyph\'s bitmap with FreeType, positions each        glyph with optional kerning, and applies line wrapping.        Allows the use of ANSI escape sequences in text to change        the colour of glyphs.        '}]}
            ],
            freeFunctions: [
                {name: 'createRenderer', signature: '(Apollo::Window *) -> Apollo::Text::Renderer *', description: ''}
                
            ]
        }
    };

    return file;
}

function createDummyDir(name, remaining) {

    let numberOfChildren = getRandomInt(1, 5);

    let dir = {
        type: "dir",
        classType: "dirType",
        name: name,
        contents: []
    };

    if (remaining > 0) {

        for (let i = 0; i < numberOfChildren; i++) {
            dir.contents.push(createDummyDir(remaining - 1));
        }
    }

    numberOfChildren = getRandomInt(3, 8);

    for (let i = 0; i < numberOfChildren; i++) {
        dir.contents.push(createDummyFile());
    }

    return dir;
}

import topLevel from './db.js';

class DocumentationViewer extends Component {

    constructor(props) {
        super(props);

        let kernel = createDummyDir("kernel");
        let services = createDummyDir("services");
        let applications = createDummyDir("applications");

        //let topLevel = createDummyDir("/", 0);
        //topLevel.contents = [applications, services, kernel];

        this.state = {
            breadcrumbs: [topLevel],
            top: topLevel,
            index: 0
        };

        this.handleListItemClick = function (index, e) {
            this.setState(Object.assign(this.state, {index: index}));
        }

        this.handleBreadcrumClick = index => {
            let crumbs = this.state.breadcrumbs.slice(0, index + 1);

            this.setState({
                breadcrumbs: crumbs,
                top: crumbs[crumbs.length - 1],
                index: 0
            });
        };

        this.renderableSelected = (file, index) => {

            let parent = this.state.top.contents[this.state.index];
            let crumbs = this.state.breadcrumbs;
            crumbs.push(parent);

            this.setState({
                breadcrumbs: crumbs,
                top: parent,
                index: index
            });
        };
    }

    render() {
        return(
            <div className={style.blueBackground}>
                <main>
                    <div className={`browser`}>
                        <div className={`browserMenu darkBlue`}>
                            <div className={`tabBar`}>

                                <div className={`tab lightBlue`}>Browse</div>
                                <div className={`tab`}>Search</div>

                            </div>
                        </div>

                        <div className={`browserNavigation lightBlue`}>
                            <div className={`navigation`}>

                                {
                                    this.state.breadcrumbs.map((crumb, index) => 
                                        <div key={index} className={`breadcrumb`}>
                                            <a className={`breadcrumbLink`}
                                                onClick={this.handleBreadcrumClick.bind(this, index)}
                                             >{crumb.name}</a>
                                        </div>
                                    )
                                }

                            </div>
                        </div>

                        <ul className={`list lightBlue`}>
                            {
                                this.state.top.contents.map((file, index) => 

                                <li className={index == this.state.index ? `darkBlue` : `lightBlue`} 
                                    key={index.toString()} 
                                    onClick={this.handleListItemClick.bind(this, index)}
                                    >
                                    <ListItem item={file}/>
                                </li>
                                
                            ) 
                            }
                        </ul>

                        <div className={`viewer darkBlue`}>
                                <Renderable item={this.state.top
                                    .contents[this.state.index]} 
                                    select={this.renderableSelected}/>
                        </div>

                    </div>
                </main>
            </div>
        );
    }
}

export default DocumentationViewer;